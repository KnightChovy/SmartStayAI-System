/**
 * Tham số VNPay gửi kèm khi redirect về (returnUrl) và khi gọi IPN.
 * VNPay luôn gửi mọi field dưới dạng string, nên giữ nguyên kiểu string.
 */
export type VnpayParams = Record<string, string>;

/** Kết quả xử lý một callback VNPay (return hoặc IPN). */
export interface VnpayResult {
  /** Đã xác minh chữ ký + thanh toán thành công và booking đã confirmed */
  success: boolean;
  /** Mã booking để client điều hướng tới trang kết quả */
  bookingCode?: string;
  /** Thông điệp ngắn (vd: lý do thất bại) */
  message: string;
  /** Mã trả về cho IPN VNPay: 00 ok, 01 không thấy, 02 đã xử lý, 04 sai tiền, 97 sai chữ ký */
  rspCode: string;
}
