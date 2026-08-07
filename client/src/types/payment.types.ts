/**
 * Type cho luồng thanh toán VNPay — model theo backend
 * (`POST /payments/bookings/:bookingId/vnpay`, callback `/booking/payment-result`).
 */

/** Phản hồi khi tạo URL thanh toán VNPay cho một booking đang chờ thanh toán. */
export interface CreateVnpayPaymentResponse {
  /** URL cổng VNPay — frontend redirect trình duyệt sang để khách thanh toán. */
  paymentUrl: string;
}

/**
 * Trạng thái kết quả thanh toán mà backend đính trên query string khi redirect
 * khách về `${CLIENT_URL}/booking/payment-result?status=...&bookingCode=...`.
 */
export type PaymentResultStatus = 'success' | 'failed';

/**
 * Thông tin QR chuyển khoản SePay (`POST /payments/bookings/:id/sepay`).
 * Khách quét QR / chuyển khoản đúng `transferContent`; SePay gọi webhook về BE
 * để đối soát và tự confirm booking — FE chỉ cần poll trạng thái booking.
 */
export interface SepayPaymentInfo {
  /** URL ảnh QR (VietQR) — chỉ cần <img src={qrUrl} />. */
  qrUrl: string;
  /** Nội dung chuyển khoản khách PHẢI giữ nguyên để webhook khớp được. */
  transferContent: string;
  amount: number;
  accountNumber: string;
  bankCode: string;
  /** Hạn giữ chỗ — quá hạn thì tiền vào cũng không tự confirm. */
  expiresAt: string | null;
}

// ============================================================
// Thanh toán + hoàn tiền đính kèm booking (`bookingInclude` của BE)
// ============================================================

/**
 * `wallet` = khách trả bằng số dư ví. Một booking có thể có **hai** dòng payment: `wallet` cho
 * phần ví lo được và cổng cho phần còn lại (BE cho phép thanh toán kết hợp), nên đừng giả định
 * mỗi booking chỉ có một phương thức.
 */
export type PaymentMethod = 'vnpay' | 'sepay' | 'stripe' | 'cash' | 'wallet';

export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

/**
 * Vòng đời một yêu cầu hoàn tiền: khách huỷ ⇒ `pending` (chờ khách sạn duyệt)
 * ⇒ `approved` (KS đồng ý, chờ Platform Manager chuyển khoản) ⇒ `processed` (tiền đã đi),
 * hoặc `rejected` kèm `rejectionReason`. Huỷ KHÔNG hoàn tiền ngay.
 */
export type RefundStatus = 'pending' | 'approved' | 'processed' | 'rejected';

/** Yêu cầu hoàn tiền như khách nhìn thấy — BE không trả gatewayResponse/transactionId. */
export interface BookingRefund {
  id: string;
  amount: string;
  status: RefundStatus;
  reason: string;
  rejectionReason?: string | null;
  reviewedAt?: string | null;
  processedAt?: string | null;
  createdAt: string;
}

/** Khoản thanh toán của booking, kèm các yêu cầu hoàn tiền phát sinh từ nó. */
export interface BookingPayment {
  id: string;
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  amount: string;
  paidAt?: string | null;
  refunds: BookingRefund[];
}
