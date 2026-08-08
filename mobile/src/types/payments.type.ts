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

// ============================================================
// Thanh toán + hoàn tiền đính kèm booking (`bookingInclude` của BE)
// ============================================================

/**
 * `wallet` = khách trả bằng số dư ví. Một booking có thể có HAI dòng payment: `wallet`
 * cho phần ví lo được và cổng cho phần còn lại (BE cho phép thanh toán kết hợp).
 */
export type PaymentMethod = 'vnpay' | 'sepay' | 'stripe' | 'cash' | 'wallet';

export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

/**
 * Vòng đời một yêu cầu hoàn tiền: khách huỷ ⇒ `pending` (chờ khách sạn duyệt) ⇒
 * `approved` (KS đồng ý, chờ Platform Manager chuyển khoản) ⇒ `processed` (tiền đã đi),
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
