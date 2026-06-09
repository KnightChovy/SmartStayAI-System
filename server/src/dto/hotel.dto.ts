/**
 * Bộ lọc tìm kiếm khách sạn theo thành phố + khoảng ngày ở.
 */
export interface HotelSearchFilter {
  city?: string;
  checkIn?: Date;
  checkOut?: Date;
  guests?: number;
}

/**
 * Bộ lọc tìm phòng (room type) bên trong một khách sạn.
 */
export interface RoomTypeSearchFilter {
  checkIn?: Date;
  checkOut?: Date;
  guests?: number;
  minPrice?: number;
  maxPrice?: number;
  bedType?: string;
  viewType?: string;
}

/**
 * Tuỳ chọn phân trang / sắp xếp khi tìm khách sạn.
 */
export interface HotelQueryOptions {
  limit?: number;
  page?: number;
  sortBy?: string;
}
