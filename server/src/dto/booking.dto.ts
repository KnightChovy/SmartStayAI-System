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
