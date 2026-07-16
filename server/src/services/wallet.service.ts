import httpStatus from 'http-status';
import { Prisma } from '@prisma/client';
import type { WalletTransactionType } from '@prisma/client';
import prisma from '../config/prisma';
import ApiError from '../utils/ApiError';
// Kiểu tx client bên trong prisma.$transaction (callback form)
type Tx = Prisma.TransactionClient;

export class WalletService {
  /** Lấy ví của hotel, tạo mới nếu chưa có. Chạy trong tx để đảm bảo nhất quán với luồng tiền. */
  private getOrCreateWallet = async (tx: Tx, hotelId: string) => {
    return tx.wallet.upsert({ where: { hotelId }, create: { hotelId }, update: {} });
  };

  /**
   * Lấy ví của khách, tạo mới nếu chưa có. Ví khách chỉ dùng balanceAvailable — tiền hoàn vào là
   * tiêu được ngay, không có khái niệm ký quỹ như ví khách sạn.
   */
  private getOrCreateCustomerWallet = async (tx: Tx, customerId: string) => {
    return tx.wallet.upsert({ where: { customerId }, create: { customerId }, update: {} });
  };

  private writeTxn = async (
    tx: Tx,
    args: {
      walletId: string;
      type: WalletTransactionType;
      amount: Prisma.Decimal;
      balanceAfter: Prisma.Decimal;
      bookingId?: string;
      commissionId?: string;
      description: string;
    }
  ) => {
    await tx.walletTransaction.create({ data: { ...args, status: 'completed' } });
  };

  /** Booking thanh toán thành công → net (totalAmount − commission) vào balancePending. */
  recordEarning = async (tx: Tx, hotelId: string, bookingId: string, netAmount: Prisma.Decimal) => {
    const wallet = await this.getOrCreateWallet(tx, hotelId);
    const newPending = wallet.balancePending.add(netAmount);
    await tx.wallet.update({ where: { id: wallet.id }, data: { balancePending: newPending } });
    await this.writeTxn(tx, {
      walletId: wallet.id,
      type: 'earning',
      amount: netAmount,
      balanceAfter: newPending,
      bookingId,
      description: 'Net doanh thu booking (chờ tất toán)',
    });
  };

  /** Tất toán 1 khoản commission → chuyển net tương ứng từ pending sang available. */
  settle = async (tx: Tx, hotelId: string, netAmount: Prisma.Decimal, commissionId: string) => {
    const wallet = await this.getOrCreateWallet(tx, hotelId);
    const newPending = wallet.balancePending.sub(netAmount);
    const newAvailable = wallet.balanceAvailable.add(netAmount);
    await tx.wallet.update({
      where: { id: wallet.id },
      data: { balancePending: newPending, balanceAvailable: newAvailable },
    });
    await this.writeTxn(tx, {
      walletId: wallet.id,
      type: 'payout',
      amount: netAmount,
      balanceAfter: newAvailable,
      commissionId,
      description: 'Chuyển pending → available (đã tất toán)',
    });
  };

  /** Huỷ/hoàn tiền → giảm phần net đã ghi ở pending đúng bằng delta. */
  recordRefund = async (
    tx: Tx,
    hotelId: string,
    bookingId: string,
    delta: Prisma.Decimal // số net bị rút bớt (dương)
  ) => {
    if (delta.lessThanOrEqualTo(0)) return;
    const wallet = await this.getOrCreateWallet(tx, hotelId);
    const newPending = wallet.balancePending.sub(delta);
    await tx.wallet.update({ where: { id: wallet.id }, data: { balancePending: newPending } });
    await this.writeTxn(tx, {
      walletId: wallet.id,
      type: 'refund',
      amount: delta.negated(),
      balanceAfter: newPending,
      bookingId,
      description: 'Điều chỉnh do huỷ/hoàn tiền',
    });
  };

  // ===== Ví khách hàng =====

  /**
   * Hoàn tiền vào ví khách. Tiền KHÔNG rời nền tảng — chỉ là bút toán — nên gọi được ngay khi
   * khách sạn duyệt, không phải chờ ai chuyển khoản.
   */
  creditCustomer = async (tx: Tx, customerId: string, amount: Prisma.Decimal, bookingId: string, description: string) => {
    const wallet = await this.getOrCreateCustomerWallet(tx, customerId);
    const newBalance = wallet.balanceAvailable.add(amount);
    await tx.wallet.update({ where: { id: wallet.id }, data: { balanceAvailable: newBalance } });
    await this.writeTxn(tx, {
      walletId: wallet.id,
      type: 'refund',
      amount,
      balanceAfter: newBalance,
      bookingId,
      description,
    });
    return newBalance;
  };

  /**
   * Trừ ví khách khi dùng số dư trả cho booking.
   *
   * Trừ CÓ ĐIỀU KIỆN (updateMany + balanceAvailable >= amount) rồi kiểm count: hai request đặt
   * phòng song song cùng tiêu một số dư thì chỉ một bên thành công — không thể tiêu vượt số dư.
   */
  debitCustomer = async (tx: Tx, customerId: string, amount: Prisma.Decimal, bookingId: string) => {
    const wallet = await this.getOrCreateCustomerWallet(tx, customerId);
    const { count } = await tx.wallet.updateMany({
      where: { id: wallet.id, balanceAvailable: { gte: amount } },
      data: { balanceAvailable: { decrement: amount } },
    });
    if (count === 0) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Số dư ví không đủ');
    }
    const after = wallet.balanceAvailable.sub(amount);
    await this.writeTxn(tx, {
      walletId: wallet.id,
      type: 'spend',
      amount: amount.negated(),
      balanceAfter: after,
      bookingId,
      description: 'Dùng số dư ví thanh toán booking',
    });
    return after;
  };

  /** Số dư ví khách (0 nếu chưa từng có ví — không tạo ví rỗng chỉ để xem). */
  getCustomerBalance = async (customerId: string): Promise<Prisma.Decimal> => {
    const wallet = await prisma.wallet.findUnique({ where: { customerId }, select: { balanceAvailable: true } });
    return wallet?.balanceAvailable ?? new Prisma.Decimal(0);
  };

  /** Ví khách + lịch sử giao dịch, mới nhất trước. */
  getCustomerWallet = async (customerId: string, limit = 50) => {
    const wallet = await prisma.wallet.findUnique({
      where: { customerId },
      include: { transactions: { orderBy: { createdAt: 'desc' }, take: limit } },
    });
    // Chưa có ví ⇒ trả về ví rỗng thay vì 404: khách chưa từng được hoàn tiền là chuyện bình thường
    return (
      wallet ?? {
        id: null,
        customerId,
        balanceAvailable: new Prisma.Decimal(0),
        currency: 'VND',
        transactions: [],
      }
    );
  };
}

export const walletService = new WalletService();
