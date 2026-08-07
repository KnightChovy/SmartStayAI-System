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

  /**
   * Ghi một dòng vào sổ ví.
   *
   * `description` viết bằng TIẾNG ANH có chủ ý: chuỗi này lưu thẳng vào DB rồi hiển thị nguyên văn,
   * nên nếu ghi tiếng Việt thì giao diện đa ngữ không dịch được. Client tự dịch theo `type` + chuỗi
   * này, giống cách xử lý các giá trị enum khác.
   */
  private writeTxn = async (
    tx: Tx,
    args: {
      walletId: string;
      type: WalletTransactionType;
      amount: Prisma.Decimal;
      balanceAfter: Prisma.Decimal;
      bookingId?: string;
      commissionId?: string;
      payoutId?: string;
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
      description: 'Booking net revenue (pending settlement)',
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
      type: 'settlement',
      amount: netAmount,
      balanceAfter: newAvailable,
      commissionId,
      description: 'Settled — moved from pending to available',
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
      description: 'Adjustment for booking cancellation/refund',
    });
  };

  /**
   * GIỮ tiền cho một yêu cầu rút: trừ balanceAvailable ngay khi partner tạo yêu cầu (không đợi duyệt)
   * để không thể tạo nhiều yêu cầu rút vượt số dư. Trừ CÓ ĐIỀU KIỆN (updateMany + balanceAvailable >=
   * amount) rồi kiểm count — hai yêu cầu song song cùng tiêu một số dư thì chỉ một bên thắng. Bị từ
   * chối thì hoàn lại bằng releasePayoutHold.
   *
   * `payoutId` BẮT BUỘC: tiền bị trừ trước khi ai duyệt, nên sổ ví phải trỏ được về yêu cầu rút để
   * biết khoản đó mới đang bị giữ hay đã thật sự chuyển đi.
   */
  holdForPayout = async (tx: Tx, hotelId: string, amount: Prisma.Decimal, payoutId: string) => {
    const wallet = await this.getOrCreateWallet(tx, hotelId);
    const { count } = await tx.wallet.updateMany({
      where: { id: wallet.id, balanceAvailable: { gte: amount } },
      data: { balanceAvailable: { decrement: amount } },
    });
    if (count === 0) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Insufficient available balance for payout');
    }
    const after = wallet.balanceAvailable.sub(amount);
    await this.writeTxn(tx, {
      walletId: wallet.id,
      type: 'payout',
      amount: amount.negated(),
      balanceAfter: after,
      payoutId,
      description: 'Payout request — funds on hold',
    });
    return after;
  };

  /** Yêu cầu rút bị TỪ CHỐI ⇒ hoàn lại phần đã giữ vào balanceAvailable. */
  releasePayoutHold = async (tx: Tx, hotelId: string, amount: Prisma.Decimal, payoutId: string) => {
    const wallet = await this.getOrCreateWallet(tx, hotelId);
    const after = wallet.balanceAvailable.add(amount);
    await tx.wallet.update({ where: { id: wallet.id }, data: { balanceAvailable: after } });
    await this.writeTxn(tx, {
      walletId: wallet.id,
      type: 'adjustment',
      amount,
      balanceAfter: after,
      payoutId,
      description: 'Payout request rejected — hold released',
    });
    return after;
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
      throw new ApiError(httpStatus.BAD_REQUEST, 'Insufficient wallet balance');
    }
    const after = wallet.balanceAvailable.sub(amount);
    await this.writeTxn(tx, {
      walletId: wallet.id,
      type: 'spend',
      amount: amount.negated(),
      balanceAfter: after,
      bookingId,
      description: 'Wallet balance used for booking payment',
    });
    return after;
  };

  /** Số dư ví khách (0 nếu chưa từng có ví — không tạo ví rỗng chỉ để xem). */
  getCustomerBalance = async (customerId: string): Promise<Prisma.Decimal> => {
    const wallet = await prisma.wallet.findUnique({ where: { customerId }, select: { balanceAvailable: true } });
    return wallet?.balanceAvailable ?? new Prisma.Decimal(0);
  };

  /**
   * Ví khách + lịch sử giao dịch, mới nhất trước.
   *
   * Chọn cột TƯỜNG MINH thay vì trả cả bản ghi: `status` luôn là 'completed' (chỉ nghĩa là đã ghi sổ)
   * còn `payoutId` thuộc luồng rút tiền của khách sạn — cả hai đều vô nghĩa với khách và dễ đọc nhầm.
   */
  getCustomerWallet = async (customerId: string, limit = 50) => {
    const wallet = await prisma.wallet.findUnique({
      where: { customerId },
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: limit,
          select: {
            id: true,
            type: true,
            amount: true,
            balanceAfter: true,
            bookingId: true,
            description: true,
            createdAt: true,
          },
        },
      },
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
