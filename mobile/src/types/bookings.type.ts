/** Type cho luồng đặt phòng — model theo backend (`/v1/bookings`). */

import type { BookingPayment } from './payments.type';

export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'checked_in'
  | 'checked_out'
  | 'cancelled'
  | 'no_show';

export type BookingSource = 'website' | 'mobile_app' | 'chatbot' | 'walk_in' | 'staff';

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
  /** Thuế (VAT…) đóng băng lúc đặt; `"0"` nếu khách sạn không khai policy `tax`. */
  taxAmount: string;
  /** Phí dịch vụ đóng băng lúc đặt; `"0"` nếu khách sạn không khai policy `fee`. */
  feeAmount: string;
  /** = subtotal − discountAmount + taxAmount + feeAmount. Số khách thực trả. */
  totalAmount: string;
  /**
   * Đã trả được bao nhiêu — tổng mọi payment `completed` (kể cả `wallet`), BE tính sẵn.
   * Booking trả GHÉP (ví một phần + cổng phần còn lại) khiến `totalAmount` không còn là
   * số sắp bị thu — luôn đọc field này thay vì tự cộng lại `payments[]`.
   */
  amountPaid: string;
  /** Còn phải trả — `totalAmount` trừ `amountPaid`, đã kẹp về 0. Luôn đọc field này. */
  remainingAmount: string;
  status: BookingStatus;
  source: BookingSource;
  specialRequests?: string | null;
  cancellationReason?: string | null;
  /**
   * Ai huỷ đơn. `system` = cron dọn đơn quá hạn giữ chỗ; các giá trị còn lại là người
   * thật. Cần để nói ĐÚNG nguyên nhân khi báo đã hoàn tiền — cùng một khối hiển thị phục
   * vụ cả đơn hệ thống tự huỷ lẫn đơn khách tự bấm huỷ, ghi cứng một câu là nói sai cho
   * nửa số ca.
   */
  cancelledByRole?:
    | 'customer'
    | 'hotel_staff'
    | 'hotel_partner'
    | 'platform_manager'
    | 'admin'
    | 'system'
    | null;
  checkedInAt?: string | null;
  checkedOutAt?: string | null;
  cancelledAt?: string | null;
  /**
   * Hạn giữ chỗ (VNPay 15', SePay 30') — cron `release-holds` huỷ đơn `pending` quá hạn
   * này (và hoàn lại phần đã trừ ví nếu có). `null` = không có hạn (đơn tiền mặt).
   */
  holdExpiresAt?: string | null;
  createdAt: string;
  updatedAt: string;
  hotel?: BookingHotelSummary;
  roomType?: BookingRoomTypeSummary;
  voucher?: BookingVoucherSummary | null;
  /** Các khoản đã thanh toán, kèm yêu cầu hoàn tiền phát sinh từ mỗi khoản (nếu có). */
  payments?: BookingPayment[];
}

/** Payload tạo booking — giá do server tự tính, client KHÔNG gửi tiền. */
export interface CreateBookingPayload {
  hotelId: string;
  roomTypeId: string;
  checkInDate: string;
  checkOutDate: string;
  numGuests: number;
  specialRequests?: string;
}

/** Query của `GET /bookings/me`. */
export interface MyBookingsParams {
  status?: BookingStatus;
  sortBy?: string;
  page?: number;
  limit?: number;
}
