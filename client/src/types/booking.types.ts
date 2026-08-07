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
  /**
   * Đã trả được bao nhiêu — tổng các payment `completed` (BE tính sẵn, `withPaymentBalance`).
   * Booking trả GHÉP (ví một phần + cổng phần còn lại) nên `totalAmount` KHÔNG còn là số sắp bị
   * thu ở cổng.
   */
  amountPaid: string;
  /**
   * Còn phải trả — dùng ĐÚNG luật `outstandingAmount` của BE (chỉ đếm payment `completed`, kẹp về
   * 0 khi lỡ trả dư). **Luôn đọc field này thay vì tự cộng `payments[]`**: mỗi nơi một công thức
   * là chắc chắn trôi lệch với số cổng thực thu.
   */
  remainingAmount: string;
  status: BookingStatus;
  source: BookingSource;
  specialRequests?: string | null;
  cancellationReason?: string | null;
  /**
   * Ai huỷ đơn. `system` = cron dọn đơn quá hạn giữ chỗ; các giá trị còn lại là người thật.
   * Cần để nói ĐÚNG nguyên nhân khi báo đã hoàn tiền — cùng một khối hiển thị phục vụ cả đơn
   * hệ thống tự huỷ lẫn đơn khách tự bấm huỷ, ghi cứng một câu là nói sai cho nửa số ca.
   */
  cancelledByRole?: 'customer' | 'hotel_staff' | 'hotel_partner' | 'platform_manager' | 'admin' | 'system' | null;
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
  /**
   * Nơi tiền sẽ về. BE trả field này ở **response huỷ đơn** (`select` của `cancelBooking`),
   * và nó quyết định hai vòng đời KHÁC HẲN nhau:
   * - `wallet`: khách sạn duyệt là BE cộng thẳng vào ví ⇒ nhảy luôn sang `processed`, không có
   *   bước Platform Manager chuyển khoản.
   * - `bank`: duyệt xong mới `approved`, phải chờ Platform Manager chuyển tay rồi mới `processed`.
   *
   * ⚠️ `booking.payments[].refunds[]` (ở `GET /bookings/:id`) **KHÔNG** có field này — BE chưa
   * select — nên chỉ biết đích đến ngay sau khi huỷ, tải lại trang là mất.
   */
  refundMethod: RefundMethod;
}

export interface CancelBookingResponse extends Booking {
  refund: CancelledRefund | null;
}

/**
 * Nơi khách muốn nhận tiền hoàn.
 * - `wallet` (mặc định của BE): cộng thẳng vào ví, khách nhận ngay khi được duyệt.
 * - `bank`: chuyển khoản — **bắt buộc** gửi kèm `bankAccount`, nếu không Platform Manager không
 *   biết chuyển đi đâu (Joi chặn ngay từ BE).
 */
export type RefundMethod = 'wallet' | 'bank';

export interface RefundBankAccount {
  /** Chỉ chữ số, tối đa 30 ký tự (Joi của BE). */
  accountNumber: string;
  bankName: string;
  accountHolder: string;
}

export interface CancelBookingPayload {
  reason?: string;
  refundMethod?: RefundMethod;
  bankAccount?: RefundBankAccount;
}

/**
 * Một bậc của chính sách huỷ: huỷ trước **ít nhất** `minHoursBefore` giờ (tính tới giờ nhận phòng)
 * ⇒ được hoàn `refundPercent`%. Danh sách bậc luôn **giảm dần** và phủ kín tới sát check-in
 * (luôn có bậc `minHoursBefore: 0`).
 */
export interface CancellationTier {
  minHoursBefore: number;
  refundPercent: number;
}

/**
 * Xem trước tiền hoàn (`GET /bookings/:bookingId/refund-preview`) — **chỉ đọc, không ghi gì**.
 *
 * Vì sao bắt buộc phải dùng: trước đây khách bấm Huỷ mà **không biết mất bao nhiêu tiền**, chỉ biết
 * sau khi đã huỷ (không hoàn tác được). BE tính bằng đúng hàm dùng cho `cancelBooking`, nên con số
 * xem trước **chính là** con số sẽ được hoàn.
 */
export interface RefundPreview {
  bookingId: string;
  bookingCode: string;
  status: BookingStatus;
  /** Huỷ được không — FE không tự suy luật. */
  canCancel: boolean;
  /** Lý do không huỷ được (tiếng Việt, của BE); `null` khi huỷ được. */
  cannotCancelReason: string | null;
  /** `false` = chưa trả đồng nào ⇒ không có gì để hoàn. */
  isPaid: boolean;
  /**
   * Đơn còn `pending` và CHƯA trả đủ ⇒ BE hoàn **100%**, KHÔNG áp bậc thang.
   *
   * Lý do (theo comment của BE): bậc thang tồn tại để bù cho khách sạn khi phòng bị giữ rồi nhả
   * sát ngày, mà đơn chưa xác nhận thì khách sạn chưa nhận đồng nào. Hơn nữa hệ thống cũng sẽ tự
   * huỷ đơn này khi hết hạn giữ chỗ và hoàn 100% — áp phí ở đây tạo nghịch lý "bấm huỷ thì mất
   * tiền, ngồi im thì được hoàn đủ".
   *
   * ⚠️ Khi cờ này bật, BE trả `appliedTier: null` + `refundPercent: 100` + `nextTier: null`.
   * FE **không được** vẽ bảng bậc thang / cảnh báo "sau mốc X còn 30%" cạnh con số hoàn 100% —
   * hai thứ đó mâu thuẫn nhau ngay trên cùng một panel.
   */
  isUnpaidPending: boolean;
  paidAmount: string;
  /** Số tiền hoàn NẾU huỷ ngay bây giờ. */
  refundAmount: string;
  /** Phần khách sạn giữ lại = `paidAmount - refundAmount`. */
  penaltyAmount: string;
  /** Số giờ còn lại tới giờ nhận phòng; âm khi đã qua. */
  hoursBeforeCheckIn: number;
  /** Bậc đang áp — `null` khi đã qua giờ nhận phòng. */
  appliedTier: CancellationTier | null;
  refundPercent: number;
  /** Toàn bộ bậc thang, để vẽ bảng cho khách đối chiếu. */
  tiers: CancellationTier[];
  /** Sau `changesAt` thì mức hoàn tụt xuống `refundPercent`; `null` khi đã ở bậc thấp nhất. */
  nextTier: { changesAt: string; refundPercent: number } | null;
  freeUntilHours: number | null;
  isFreeCancellation: boolean;
  freeUntilMoment: string | null;
  /** Ngày nhận phòng đã ghép với giờ nhận phòng của khách sạn. */
  checkInMoment: string;
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
