/**
 * Type cho khách sạn / loại phòng — model theo response của backend
 * (`GET /hotels`, `GET /hotels/:id/room-types`).
 * Lưu ý: các field Decimal của Prisma serialize qua JSON thành **string**.
 */

/** Chính sách thú cưng của khách sạn (khớp enum BE). */
export type PetsPolicy = 'not_allowed' | 'allowed' | 'on_request';

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

/** Body cho `PATCH /hotels/:id/publish` — bật/tắt mở bán khách sạn. */
export interface SetHotelListingRequest {
  isListed: boolean;
}

/** Khách sạn (raw) trả về sau khi đổi trạng thái mở bán (`PATCH /hotels/:id/publish`). */
export interface Hotel {
  id: string;
  partnerId: string;
  name: string;
  slug: string | null;
  description: string | null;
  address: string;
  city: string;
  country: string;
  businessType: string | null;
  businessRegistrationNumber: string | null;
  taxCode: string | null;
  district: string | null;
  ward: string | null;
  latitude: number | null;
  longitude: number | null;
  starRating: number | null;
  checkInTime: string | null;
  checkOutTime: string | null;
  isActive: boolean;
  isListed: boolean;
  // ----- Chi tiết bổ sung kiểu booking.com (Pha 1 DB) -----
  postalCode?: string | null;
  phone?: string | null;
  email?: string | null;
  totalFloors?: number | null;
  builtYear?: number | null;
  renovationYear?: number | null;
  isSmokingAllowed?: boolean | null;
  petsPolicy?: PetsPolicy | null;
  cancellationPolicy?: string | null;
  childrenPolicy?: string | null;
  minGuestAge?: number | null;
  securityDepositAmount?: string | null;
  languagesSpoken?: string[] | null;
  maxLengthOfStay?: number | null;
  settings: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface Amenity {
  id: string;
  name: string;
  icon?: string | null;
  category: 'room' | 'hotel' | 'service';
}

/** Body cho `POST /amenities` — tạo tiện nghi vào catalog (quyền manageAmenities). */
export interface CreateAmenityDto {
  name: string;
  icon?: string | null;
  category: 'room' | 'hotel' | 'service';
}

/** Body cho `PATCH /amenities/:id` — cập nhật tiện nghi (partial, tối thiểu 1 field). */
export interface UpdateAmenityDto {
  name?: string;
  icon?: string | null;
  category?: 'room' | 'hotel' | 'service';
}

/**
 * Body cho `PATCH /hotels/:id` — cập nhật hồ sơ khách sạn (partial, tối thiểu 1 field).
 * KHÔNG gồm isActive/isListed (dùng flow publish) và taxCode/businessRegistrationNumber (khoá).
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
  // ----- Chi tiết bổ sung kiểu booking.com (Pha 1 DB) — đều tuỳ chọn -----
  postalCode?: string | null;
  phone?: string | null;
  email?: string | null;
  totalFloors?: number | null;
  builtYear?: number | null;
  renovationYear?: number | null;
  isSmokingAllowed?: boolean;
  petsPolicy?: PetsPolicy | null;
  cancellationPolicy?: string | null;
  childrenPolicy?: string | null;
  minGuestAge?: number | null;
  securityDepositAmount?: number | null;
  /** Gửi [] để xoá hết. */
  languagesSpoken?: string[];
  maxLengthOfStay?: number | null;
}

/** Một ảnh khách sạn cần thêm (URL phải upload qua `POST /uploads` trước). */
export interface HotelImageInput {
  url: string;
  imageCategory: 'cover' | 'exterior' | 'room';
  caption?: string | null;
  isPrimary?: boolean;
  sortOrder?: number;
}

/** Body cho `POST /hotels/:id/images`. */
export interface AddHotelImagesDto {
  images: HotelImageInput[];
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
  // ----- Chi tiết bổ sung kiểu booking.com (Pha 1 DB) -----
  maxAdults?: number | null;
  maxChildren?: number | null;
  sizeUnit?: 'sqm' | 'sqft' | null;
  isNonSmoking?: boolean | null;
  hasPrivateBathroom?: boolean | null;
  hasBalcony?: boolean | null;
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
