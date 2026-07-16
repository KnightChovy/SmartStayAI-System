import type { BookingStatus } from '@prisma/client';

/**
 * Payload tạo booking. Giá tiền KHÔNG nhận từ client — server tự tính từ
 * basePrice/priceOverride để không bị sửa giá.
 */
export interface CreateBookingDto {
  hotelId: string;
  roomTypeId: string;
  checkInDate: Date;
  checkOutDate: Date;
  numGuests: number;
  specialRequests?: string;
  // 'vnpay' = trả trước qua cổng (mặc định); 'sepay' = chuyển khoản quét QR;
  // 'cash' = trả tiền mặt tại khách sạn khi tới
  paymentMethod?: 'vnpay' | 'sepay' | 'cash';
}

/** Bộ lọc khi liệt kê booking của user. */
export interface BookingFilter {
  status?: BookingStatus;
}

/** Tuỳ chọn phân trang / sắp xếp khi liệt kê booking. */
export interface BookingQueryOptions {
  limit?: number;
  page?: number;
  sortBy?: string;
}

/** Bộ lọc khi staff/chủ KS xem booking của một khách sạn (theo trạng thái + ngày nhận phòng). */
export interface HotelBookingFilter {
  status?: BookingStatus;
  fromDate?: Date;
  toDate?: Date;
}

/** Bộ lọc khi Platform Manager xem TOÀN BỘ booking toàn sàn (lọc thêm theo KS/đối tác + tìm kiếm). */
export interface PlatformBookingFilter {
  status?: BookingStatus;
  hotelId?: string;
  partnerId?: string;
  fromDate?: Date;
  toDate?: Date;
  search?: string; // mã booking / tên / email khách
}

/** Bộ lọc khi partner xem booking của MỌI khách sạn của mình (tuỳ chọn thu hẹp theo 1 KS). */
export interface PartnerBookingFilter {
  status?: BookingStatus;
  hotelId?: string;
  fromDate?: Date;
  toDate?: Date;
  search?: string;
}

/** Payload check-in: gán phòng vật lý cụ thể (tuỳ chọn) + mã voucher để đối chiếu (tuỳ chọn). */
export interface CheckInBookingDto {
  roomId?: string;
  voucherCode?: string;
}

/** Payload check-out: phụ thu phát sinh khi trả phòng (mặc định 0). */
export interface CheckOutBookingDto {
  extraCharge?: number;
}
