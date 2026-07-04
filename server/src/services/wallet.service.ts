import type { Prisma, WalletTransactionType } from '@prisma/client';
// Kiểu tx client bên trong prisma.$transaction (callback form)
type Tx = Prisma.TransactionClient;

export class WalletService {
  /** Lấy ví của hotel, tạo mới nếu chưa có. Chạy trong tx để đảm bảo nhất quán với luồng tiền. */
  private getOrCreateWallet = async (tx: Tx, hotelId: string) => {
    return tx.wallet.upsert({ where: { hotelId }, create: { hotelId }, update: {} });
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
}

export const walletService = new WalletService();
