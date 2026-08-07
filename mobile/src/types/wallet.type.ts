/**
 * Ví của KHÁCH (customer) — model theo backend (`GET /v1/users/me/wallet`).
 * Mirror `client/src/types/wallet.types.ts`: tiền vào ví chỉ qua hoàn tiền huỷ đơn
 * (`refundMethod: 'wallet'`), tiền ra chỉ qua `POST /payments/bookings/:id/wallet`.
 */

/** Ví khách chỉ có 3 loại giao dịch — hẹp hơn enum Prisma (loại kia là của ví khách sạn). */
export type CustomerWalletTxnType = 'refund' | 'spend' | 'adjustment';

export interface CustomerWalletTransaction {
  id: string;
  type: CustomerWalletTxnType;
  /** Decimal → string, mang sẵn dấu: `+` khi hoàn, `−` khi tiêu. */
  amount: string;
  balanceAfter: string;
  bookingId: string | null;
  commissionId: string | null;
  description: string | null;
  createdAt: string;
}

/** `id: null` khi khách chưa từng phát sinh giao dịch nào (chưa có ví). */
export interface CustomerWallet {
  id: string | null;
  customerId: string;
  balanceAvailable: string;
  currency: string;
  /** Tối đa 50 dòng, mới nhất trước — BE không phân trang endpoint này. */
  transactions: CustomerWalletTransaction[];
}

/**
 * Kết quả trả booking bằng ví (`POST /payments/bookings/:bookingId/wallet`).
 * Ví KHÔNG đủ vẫn dùng được — BE trừ hết phần ví lo được, giữ booking ở `pending` để
 * trả nốt qua cổng. Đây là thanh toán MỘT PHẦN, luôn phải đọc `remainingToPay`.
 */
export interface PayWithWalletResponse {
  bookingCode: string;
  /** Số tiền ví vừa trừ ở lượt gọi này. */
  walletApplied: string;
  /** Còn thiếu bao nhiêu; `"0"` = đã trả đủ. */
  remainingToPay: string;
  bookingStatus: 'confirmed' | 'pending';
  /** Chỉ có khi booking được chốt (`confirmed`). */
  voucherCode: string | null;
  /** Số dư ví SAU giao dịch. */
  walletBalance: string;
}
