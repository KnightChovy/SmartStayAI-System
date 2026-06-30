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

/**
 * Payload cập nhật hồ sơ khách sạn (tất cả tuỳ chọn — partial update). KHÔNG cho sửa qua đây:
 * - isActive / isListed: có luồng riêng (duyệt hồ sơ + publish).
 * - taxCode / businessRegistrationNumber: trường pháp lý đã được manager verify lúc duyệt.
 */
export interface UpdateHotelDto {
  name?: string;
  description?: string | null;
  address?: string;
  city?: string;
  country?: string;
  district?: string | null;
  ward?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  starRating?: number | null;
  checkInTime?: string | null;
  checkOutTime?: string | null;
  businessType?: 'hotel' | 'resort' | 'villa' | 'apartment';
}

/** Ảnh khách sạn để thêm (URL đã upload trước qua POST /v1/uploads). */
export interface HotelImageInput {
  url: string;
  imageCategory: 'cover' | 'exterior' | 'room';
  caption?: string;
  isPrimary?: boolean;
  sortOrder?: number;
}
