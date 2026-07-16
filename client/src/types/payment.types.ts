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
