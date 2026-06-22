/**
 * Type cho khách sạn / loại phòng — model theo response của backend
 * (`GET /hotels`, `GET /hotels/:id/room-types`).
 * Lưu ý: các field Decimal của Prisma serialize qua JSON thành **string**.
 */

export interface HotelImage {
  id: string;
  hotelId: string;
  imageCategory: 'cover' | 'exterior' | 'room';
  url: string;
  caption?: string | null;
  isPrimary?: boolean | null;
  sortOrder?: number | null;
}

/** Khách sạn trong kết quả tìm kiếm (kèm ảnh primary + giá "từ"). */
export interface HotelSearchResult {
  id: string;
  name: string;
  slug?: string | null;
  description?: string | null;
  address: string;
  city: string;
  country: string;
  district?: string | null;
  ward?: string | null;
  starRating?: number | null;
  checkInTime?: string | null;
  checkOutTime?: string | null;
  latitude?: string | null;
  longitude?: string | null;
  images: HotelImage[];
  /** basePrice thấp nhất trong các loại phòng phù hợp; null nếu chưa có. */
  minPrice: string | null;
}

/**
 * Khách sạn của partner đang đăng nhập (`GET /hotels/mine`).
 * Kèm ảnh primary + số lượng loại phòng / phòng để hiển thị bảng tổng quan.
 */
export interface PartnerHotel {
  id: string;
  partnerId: string;
  name: string;
  slug?: string | null;
  description?: string | null;
  address: string;
  city: string;
  country: string;
  district?: string | null;
  ward?: string | null;
  starRating?: number | null;
  checkInTime?: string | null;
  checkOutTime?: string | null;
  isActive: boolean;
  isListed: boolean;
  createdAt: string;
  updatedAt: string;
  images: HotelImage[];
  _count: { roomTypes: number; rooms: number };
}

export interface Amenity {
  id: string;
  name: string;
  icon?: string | null;
  category: 'room' | 'hotel' | 'service';
}

export interface RoomTypeImage {
  id: string;
  roomTypeId: string;
  url: string;
  isPrimary?: boolean | null;
  sortOrder?: number | null;
}

export interface RoomType {
  id: string;
  hotelId: string;
  name: string;
  description?: string | null;
  maxOccupancy: number;
  basePrice: string;
  areaSqm?: string | null;
  bedType?: string | null;
  viewType?: string | null;
  isActive: boolean;
  images: RoomTypeImage[];
  amenities: { amenity: Amenity }[];
  /** Chỉ có khi search kèm khoảng ngày (checkIn/checkOut). */
  numNights?: number;
  availableRooms?: number;
  totalPrice?: string;
}

/** Tham số tìm khách sạn (query string của `GET /hotels`). */
export interface HotelSearchParams {
  city?: string;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
  sortBy?: string;
  page?: number;
  limit?: number;
}

/** Tham số lọc loại phòng trong 1 khách sạn. */
export interface RoomTypeParams {
  checkIn?: string;
  checkOut?: string;
  guests?: number;
  minPrice?: number;
  maxPrice?: number;
  bedType?: string;
  viewType?: string;
}
