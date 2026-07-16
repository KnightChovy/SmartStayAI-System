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

/**
 * Payload SePay POST về webhook khi có biến động số dư tài khoản ngân hàng.
 * Tên field theo tài liệu SePay (https://docs.sepay.vn/tich-hop-webhooks.html).
 * Chỉ khai các field mình thực sự dùng + vài field hữu ích cho đối soát.
 */
// Khai bằng `type` (không phải `interface`) để object này gán thẳng được vào cột Json của Prisma:
// interface không có index signature ngầm nên TS sẽ từ chối, type alias thì được.
export type SepayWebhookPayload = {
  /** Id giao dịch phía SePay — dùng để đối soát/truy vết */
  id: number;
  /** Tên ngân hàng (vd: Vietcombank) */
  gateway: string;
  transactionDate: string;
  accountNumber: string;
  /** Mã thanh toán SePay tự bóc theo cấu hình (có thể null nếu không khớp mẫu) */
  code: string | null;
  /** Nội dung chuyển khoản thô — nơi chứa mã booking */
  content: string;
  /** 'in' = tiền vào, 'out' = tiền ra. Chỉ xử lý 'in'. */
  transferType: 'in' | 'out';
  /** Số tiền giao dịch (VND) */
  transferAmount: number;
  /** Số dư luỹ kế sau giao dịch */
  accumulated?: number;
  /** Mã tham chiếu của ngân hàng */
  referenceCode?: string;
  description?: string;
  subAccount?: string | null;
};

/** Thông tin để client dựng màn hình quét QR chuyển khoản SePay. */
export interface SepayPaymentInfo {
  /** URL ảnh QR (VietQR) — client chỉ cần <img src={qrUrl} /> */
  qrUrl: string;
  /** Nội dung chuyển khoản khách PHẢI giữ nguyên để webhook đối soát được */
  transferContent: string;
  amount: number;
  accountNumber: string;
  bankCode: string;
  /** Hạn giữ chỗ của booking — quá hạn thì tiền vào cũng không tự confirm */
  expiresAt: Date | null;
}
