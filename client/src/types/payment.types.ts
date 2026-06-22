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
