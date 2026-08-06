import type { BookingFormValues } from '@/validations/booking.validation';
import type { BookingPayment, RefundStatus } from '@/types/payment.types';
import type { HotelCharge } from '@/types/hotel-property.types';

export interface BookingDetailsFormProps {
  onSubmit: (values: BookingFormValues) => void;
}

export interface BookingSidebarProps {
  checkIn: string;
  checkOut: string;
  nights: number;
  guests: string;
  roomName: string;
  pricePerNight: number;
  formatDisplayDate: (dateStr: string) => string;
}

// ============================================================
// Type cho luồng đặt phòng nối API (`/bookings`)
// ============================================================

export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'checked_in'
  | 'checked_out'
  | 'cancelled'
  | 'no_show';

export type BookingSource =
  | 'website'
  | 'mobile_app'
  | 'chatbot'
  | 'walk_in'
  | 'staff';

/** Tóm tắt khách sạn/loại phòng đính kèm trong booking (backend include sẵn). */
export interface BookingHotelSummary {
  id: string;
  name: string;
  address: string;
  city: string;
  checkInTime?: string | null;
  checkOutTime?: string | null;
}

export interface BookingRoomTypeSummary {
  id: string;
  name: string;
  bedType?: string | null;
  viewType?: string | null;
  maxOccupancy: number;
}

/** E-voucher đính kèm booking (backend include sẵn) — dùng để render QR check-in. */
export interface BookingVoucherSummary {
  voucherCode: string;
  qrData: string;
  usedAt?: string | null;
}

/** Booking trả về từ backend. Decimal serialize thành string qua JSON. */
export interface Booking {
  id: string;
  bookingCode: string;
  customerId: string;
  hotelId: string;
  roomTypeId: string;
  checkInDate: string;
  checkOutDate: string;
  numNights: number;
  numGuests: number;
  basePricePerNight: string;
  /** Tiền phòng thuần — CHƯA gồm thuế/phí. */
  subtotal: string;
  discountAmount: string;
  /** Thuế (VAT…) đóng băng lúc đặt; "0" nếu KS không khai báo policy `tax`. */
  taxAmount: string;
  /** Phí dịch vụ đóng băng lúc đặt; "0" nếu KS không khai báo policy `fee`. */
  feeAmount: string;
  /** = subtotal − discountAmount + taxAmount + feeAmount. Đây là số khách thực trả. */
  totalAmount: string;
  status: BookingStatus;
  source: BookingSource;
  specialRequests?: string | null;
  cancellationReason?: string | null;
  checkedInAt?: string | null;
  checkedOutAt?: string | null;
  cancelledAt?: string | null;
  /**
   * Hạn giữ chỗ của đơn `pending` chưa trả tiền (VNPay 15 phút, SePay 30 phút);
   * `null` với đơn tiền mặt (BE confirm ngay). Quá hạn thì cron `releaseExpiredHolds`
   * huỷ đơn, và mọi endpoint tạo thanh toán trả 400 "Booking đã quá hạn giữ chỗ"
   * ⇒ đây là điều kiện để hiện/ẩn nút thanh toán lại.
   */
  holdExpiresAt?: string | null;
  createdAt: string;
  updatedAt: string;
  hotel?: BookingHotelSummary;
  roomType?: BookingRoomTypeSummary;
  voucher?: BookingVoucherSummary | null;
  /**
   * Thanh toán + yêu cầu hoàn tiền (BE include sẵn ở `GET /bookings/me`, `GET /bookings/:id`
   * và response huỷ) — khách tự theo dõi được pending → approved → processed / rejected.
   */
  payments?: BookingPayment[];
}

/**
 * Response `PATCH /bookings/:id/cancel` = booking đã huỷ + yêu cầu hoàn tiền vừa tạo.
 * `refund` là **null** khi không có gì để hoàn (booking chưa thanh toán, hoặc huỷ muộn bị
 * phạt hết theo chính sách) — KHÔNG được hiểu là "đã hoàn tiền".
 */
export interface CancelledRefund {
  id: string;
  amount: string;
  status: RefundStatus;
}

export interface CancelBookingResponse extends Booking {
  refund: CancelledRefund | null;
}

/**
 * Payload viết đánh giá sau khi trả phòng (`POST /reviews`).
 * BE chỉ cần `bookingId` (tự suy ra hotel + kiểm quyền/điều kiện), không cần hotelName/bookingCode.
 */
export interface CreateReviewPayload {
  bookingId: string;
  overallRating: number;
  cleanlinessRating: number;
  serviceRating: number;
  locationRating: number;
  valueRating: number;
  title?: string;
  content: string;
  images?: string[];
}

/** Sửa đánh giá của chính mình (`PATCH /reviews/:reviewId`) — mọi field optional. */
export interface UpdateReviewPayload {
  overallRating?: number;
  cleanlinessRating?: number;
  serviceRating?: number;
  locationRating?: number;
  valueRating?: number;
  title?: string;
  content?: string;
  images?: string[];
}

/** Payload tạo booking — giá do server tự tính, client KHÔNG gửi tiền. */
export interface CreateBookingPayload {
  hotelId: string;
  roomTypeId: string;
  checkInDate: string;
  checkOutDate: string;
  /**
   * Tách người lớn / trẻ em. BE kiểm RIÊNG `numAdults` với `roomType.maxAdults` và
   * `numChildren` với `maxChildren` (`booking.service.ts`), nên gộp tất cả vào `numGuests`
   * là coi trẻ em như người lớn ⇒ đơn 2 lớn + 2 nhỏ có thể bị từ chối oan ở phòng
   * `maxAdults = 2`. Joi bắt buộc có ít nhất một trong `numGuests | numAdults`.
   */
  numAdults: number;
  numChildren: number;
  specialRequests?: string;
  /**
   * BE nhận `vnpay | sepay | cash` (mặc định `vnpay`) — khớp `booking.validation.ts`.
   * `cash` → confirm ngay + phát voucher; `vnpay` → giữ chỗ 15 phút; `sepay` → giữ chỗ 30 phút
   * (chuyển khoản ngân hàng chậm hơn quẹt thẻ qua cổng).
   */
  paymentMethod?: 'vnpay' | 'sepay' | 'cash';
}

export interface MyBookingsParams {
  status?: BookingStatus;
  sortBy?: string;
  page?: number;
  limit?: number;
}

// ============================================================
// Ước tính thuế & phí ở checkout (booking chưa tồn tại nên BE chưa có số thật)
// ============================================================

/** Kết quả ước tính — VND, khớp cách BE tính lúc tạo booking. */
export interface TaxFeeEstimate {
  taxAmount: number;
  feeAmount: number;
  /** subtotal + taxAmount + feeAmount (checkout chưa có giảm giá). */
  total: number;
}

export interface TaxFeeEstimateInput {
  /**
   * Khoản thu thuế/phí của khách sạn (`GET /hotels/:id` → `charges[]`).
   *
   * ⚠️ Trước đây là `policies[]`, nhưng BE đã tách thuế/phí sang bảng `hotel_charges`
   * (migration `split_policy_and_charge`) ⇒ `policies` không còn khoản tiền nào để tính.
   *
   * `undefined` = CHƯA BIẾT (chưa load xong) — khác hẳn `[]` = KS không thu khoản nào.
   */
  charges: HotelCharge[] | undefined;
  /** Tiền phòng thuần cả kỳ ở (chưa thuế/phí). */
  subtotal: number;
  numNights: number;
  numGuests: number;
}
