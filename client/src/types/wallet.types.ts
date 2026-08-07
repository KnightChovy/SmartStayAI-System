/**
 * Ví của KHÁCH (role customer) — khác hẳn ví khách sạn ở `hotel-revenue.types.ts`.
 *
 * Endpoint: `GET /users/me/wallet` (auth, tự suy customer từ token — không có param nào).
 *
 * Tiền vào ví bằng đúng một đường: khách huỷ booking và chọn `refundMethod: 'wallet'`, khách sạn
 * duyệt xong thì BE cộng thẳng (`walletService.creditCustomer`) — không cần ai chuyển khoản vì
 * tiền không rời nền tảng. Tiền ra bằng `POST /payments/bookings/:id/wallet`.
 */

/**
 * Các loại giao dịch một ví KHÁCH thực sự có thể có.
 *
 * CỐ Ý hẹp hơn enum `WalletTransactionType` của Prisma (7 giá trị): `earning`, `commission`,
 * `payout`, `settlement` là bút toán của ví KHÁCH SẠN, không bao giờ xuất hiện ở đây. Khai rộng
 * ra chỉ khiến UI phải xử lý những nhánh không tồn tại. Dù vậy nơi hiển thị vẫn phải có nhánh
 * dự phòng cho giá trị lạ — BE có thể thêm loại mới mà FE chưa kịp biết.
 */
export type CustomerWalletTxnType = 'refund' | 'spend' | 'adjustment';

export interface CustomerWalletTransaction {
  id: string;
  type: CustomerWalletTxnType;
  /** Decimal serialize thành string, **mang sẵn dấu**: `+` khi được hoàn, `−` khi tiêu. */
  amount: string;
  balanceAfter: string;
  bookingId: string | null;
  commissionId: string | null;
  status: string;
  description: string | null;
  createdAt: string;
}

/**
 * ⚠️ Khách chưa từng được hoàn tiền thì **chưa có ví** — BE không tạo ví rỗng chỉ để xem, mà trả
 * về một object giả với `id: null` và **thiếu hẳn** `balancePending`/`createdAt`/`updatedAt`.
 * Vì vậy chỉ khai đúng những field CHẮC CHẮN có ở cả hai nhánh; `balancePending` cố ý không khai
 * vì ví khách luôn để 0 (xem comment trong `schema.prisma`).
 */
export interface CustomerWallet {
  /** `null` khi khách chưa từng phát sinh giao dịch nào. */
  id: string | null;
  customerId: string;
  balanceAvailable: string;
  currency: string;
  /** Tối đa 50 dòng, mới nhất trước. BE **không** phân trang endpoint này. */
  transactions: CustomerWalletTransaction[];
}

/**
 * Kết quả trả booking bằng số dư ví (`POST /payments/bookings/:bookingId/wallet`).
 *
 * Ví **không đủ** thì BE vẫn trừ hết phần ví lo được và giữ booking ở `pending` để khách trả nốt
 * qua cổng — nên đây là thanh toán **một phần**, không phải all-or-nothing. UI bắt buộc phải đọc
 * `remainingToPay` chứ không thể coi 201 là "đã thanh toán xong".
 */
export interface PayWithWalletResponse {
  bookingCode: string;
  /** Số tiền ví đã trừ lần này. */
  walletApplied: string;
  /** Còn thiếu bao nhiêu; `"0"` nghĩa là đã trả đủ. */
  remainingToPay: string;
  bookingStatus: 'confirmed' | 'pending';
  /** Chỉ có khi booking được chốt (`confirmed`) — e-voucher vừa phát. */
  voucherCode: string | null;
  /** Số dư ví SAU giao dịch. */
  walletBalance: string;
}
