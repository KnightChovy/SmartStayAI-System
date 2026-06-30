/**
 * Type cho khách sạn / loại phòng — model theo response của backend
 * (`GET /v1/hotels`, `GET /v1/hotels/:id`, `GET /v1/hotels/:id/room-types`).
 * Lưu ý: các field Decimal của Prisma serialize qua JSON thành **string**.
 */
import type { Amenity } from '@/types/amenities.type';

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

/** Tham số lọc loại phòng trong 1 khách sạn (`GET /hotels/:id/room-types`). */
export interface RoomTypeParams {
  checkIn?: string;
  checkOut?: string;
  guests?: number;
  minPrice?: number;
  maxPrice?: number;
  bedType?: string;
  viewType?: string;
}
