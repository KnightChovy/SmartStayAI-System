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
