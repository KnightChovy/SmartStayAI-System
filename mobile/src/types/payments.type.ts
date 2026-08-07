/**
 * Type cho luồng thanh toán VNPay — model theo backend
 * (`POST /v1/payments/bookings/:bookingId/vnpay`).
 */

/** Phản hồi khi tạo URL thanh toán VNPay cho một booking đang chờ thanh toán. */
export interface CreateVnpayPaymentResponse {
  /** URL cổng VNPay — mở qua WebBrowser/Linking để khách thanh toán. */
  paymentUrl: string;
}

/** Trạng thái kết quả thanh toán backend đính trên query khi redirect về app. */
export type PaymentResultStatus = 'success' | 'failed';

/**
 * Thông tin QR chuyển khoản SePay (`POST /payments/bookings/:id/sepay`).
 * Khách quét QR / chuyển khoản đúng `transferContent`; SePay gọi webhook về BE để đối
 * soát và tự confirm booking — app chỉ cần poll trạng thái booking (không redirect).
 */
export interface SepayPaymentInfo {
  /** URL ảnh QR (VietQR) — hiển thị thẳng qua `expo-image`. */
  qrUrl: string;
  /** Nội dung chuyển khoản khách PHẢI giữ nguyên để webhook khớp được. */
  transferContent: string;
  amount: number;
  accountNumber: string;
  bankCode: string;
  /** Hạn giữ chỗ — quá hạn thì tiền vào cũng không tự confirm. */
  expiresAt: string | null;
}
