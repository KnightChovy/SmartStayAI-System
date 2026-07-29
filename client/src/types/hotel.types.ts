/**
 * Type cho khách sạn / loại phòng — model theo response của backend
 * (`GET /hotels`, `GET /hotels/:id`, `GET /hotels/:id/room-types`).
 * Lưu ý: các field Decimal của Prisma serialize qua JSON thành **string**.
 */
import type {
  HotelCharge,
  HotelContact,
  HotelNearbyPlace,
  HotelPolicy,
  RoomBed,
} from './hotel-property.types';

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

/** Tiện nghi rút gọn hiển thị trên card search (BE trả tối đa 3). */
export interface TopAmenity {
  id: string;
  name: string;
  icon?: string | null;
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
  /** Tối đa 3 tiện nghi nổi bật (SS-102). */
  topAmenities?: TopAmenity[];
  /** Tổng phòng trống khi search có ngày; null khi tìm không kèm ngày (SS-102). */
  availableRooms?: number | null;
  /** Điểm đánh giá TB (thang 5, 1 chữ số); null khi chưa có review (SS-005). */
  avgRating?: number | null;
  /** Số lượng đánh giá (SS-005). */
  reviewCount?: number;
}

/** Response `GET /hotels` — Paginated + `priceBounds` để FE set min/max slider (SS-101). */
export interface HotelSearchResponse {
  results: HotelSearchResult[];
  page: number;
  limit: number;
  totalPages: number;
  totalResults: number;
  /** Dải giá/đêm của toàn bộ kết quả TRƯỚC khi áp filter giá; null khi không có giá. */
  priceBounds: { min: string; max: string } | null;
}

/**
 * Chi tiết khách sạn công khai (`GET /hotels/:id`) — KHÔNG cần đăng nhập.
 * BE trả đầy đủ hơn `HotelSearchResult` rất nhiều: tiện nghi, chính sách, địa điểm lân cận,
 * loại phòng và toàn bộ field chính sách dạng scalar. Dùng cho trang chi tiết guest.
 */
export interface HotelDetail extends HotelSearchResult {
  amenities: { amenity: Amenity }[];
  policies: HotelPolicy[];
  /**
   * Khoản thu (thuế/phí) engine dùng để tính tiền — BE include ở `GET /hotels/:id`.
   * ⚠️ Từ migration `split_policy_and_charge`, thuế/phí **không còn nằm trong `policies`**;
   * muốn tính thuế phải đọc mảng này.
   */
  charges: HotelCharge[];
  nearbyPlaces: HotelNearbyPlace[];
  contacts: HotelContact[];
  roomTypes?: RoomType[];
  /** Chính sách dạng văn bản tự do do partner nhập. */
  cancellationPolicy?: string | null;
  childrenPolicy?: string | null;
  petsPolicy?: PetsPolicy | null;
  isSmokingAllowed?: boolean | null;
  minGuestAge?: number | null;
  languagesSpoken?: string[] | null;
  /** Số đêm tối đa cho một lượt đặt (`Hotel.maxLengthOfStay`). */
  maxLengthOfStay?: number | null;
  /**
   * Cấu hình khách sạn dạng JSON tự do. Chứa `cancellation.freeUntilHours`. Ưu tiên đọc
   * `cancellationRule` (đã parse) thay vì tự bóc `settings`.
   */
  settings?: Record<string, unknown> | null;
  /**
   * Chính sách hủy đã parse sẵn (BE trả top-level ở `GET /hotels/:id`) — dùng cho dòng
   * chính sách hủy ở booking card (SS-302). `freeUntilHours > 0` = hủy miễn phí trước N giờ.
   */
  cancellationRule?: { freeUntilHours: number; latePenalty: string } | null;
  /** Tiền cọc thu khi nhận phòng — Decimal ⇒ string qua JSON. */
  securityDepositAmount?: string | null;
  phone?: string | null;
  email?: string | null;
  postalCode?: string | null;
  totalFloors?: number | null;
  builtYear?: number | null;
  renovationYear?: number | null;
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
  /** Cấu hình giường chi tiết (BE include ở `GET /hotels/:id/room-types`). */
  beds?: RoomBed[];
  images: RoomTypeImage[];
  amenities: { amenity: Amenity }[];
  /** Chỉ có khi search kèm khoảng ngày (checkIn/checkOut). */
  numNights?: number;
  availableRooms?: number;
  /**
   * ⚠️ `totalPrice` ở ĐÂY (`GET /hotels/:id/room-types`) là SỐ CUỐI khách trả:
   * `subtotal + taxAmount + feeAmount` (BE `hotel.service.ts` → `getRoomTypes`).
   * KHÔNG cộng thêm thuế lên số này nữa — sẽ tính thuế hai lần.
   * (Khác với `RoomTypeDetail.totalPrice` = tiền phòng thuần — xem type đó.)
   */
  totalPrice?: string;
  /** Tiền phòng thuần cả kỳ ở (chưa thuế/phí). Đi kèm `totalPrice` khi có khoảng ngày. */
  subtotal?: string;
  /** Thuế thật BE tính (cùng hàm `computeTaxAndFees` lúc đặt) — không cần ước tính lại. */
  taxAmount?: string;
  /** Phí dịch vụ thật BE tính. */
  feeAmount?: string;
}

/** Thông tin khách sạn tối giản mà `GET /hotels/:id/room-types/:roomTypeId` kèm theo. */
export interface RoomTypeHotelSummary {
  id: string;
  name: string;
  address: string;
  city: string;
  country: string;
  starRating?: number | null;
  checkInTime?: string | null;
  checkOutTime?: string | null;
}

/**
 * Chi tiết một loại phòng (`GET /hotels/:hotelId/room-types/:roomTypeId`) — public.
 *
 * ⚠️ Khác biệt QUAN TRỌNG so với `RoomType` của endpoint danh sách: ở đây BE **không**
 * trả `subtotal`/`taxAmount`/`feeAmount`, và `totalPrice` là **tiền phòng thuần**
 * (chưa thuế/phí) — xem `hotel.service.ts` → `getRoomTypeById`. Vì vậy trang chi tiết
 * phải tự ước tính thuế từ `policies` của khách sạn (như trang checkout đang làm).
 * `null` khi không tính được giá.
 */
export interface RoomTypeDetail
  extends Omit<RoomType, 'totalPrice' | 'subtotal' | 'taxAmount' | 'feeAmount'> {
  hotel: RoomTypeHotelSummary;
  /** Tiền phòng thuần cả kỳ ở — chỉ có khi truyền cả checkIn + checkOut. */
  totalPrice?: string | null;
}

/**
 * Query của `GET /hotels/:hotelId/room-types/:roomTypeId`.
 * BE dùng Joi `.and('checkIn','checkOut')` ⇒ phải truyền CẢ HAI hoặc KHÔNG truyền gì;
 * gửi mỗi một cái là 400.
 */
export interface RoomTypeDetailParams {
  checkIn?: string;
  checkOut?: string;
}

/** Tham số tìm khách sạn (query string của `GET /hotels`). */
/** Giá trị sort được BE whitelist (SS-103). */
export type HotelSortBy = 'recommended' | 'price:asc' | 'price:desc' | 'rating:desc';

export interface HotelSearchParams {
  city?: string;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
  sortBy?: HotelSortBy;
  page?: number;
  limit?: number;
  /** Giá/đêm tối thiểu (VNĐ) — SS-101. */
  priceMin?: number;
  /** Giá/đêm tối đa (> priceMin) — SS-101. */
  priceMax?: number;
  /** CSV hạng sao, vd "3,4,5" (OR trong nhóm) — SS-101. */
  stars?: string;
  /** CSV amenityId (UUID) — KS phải có ĐỦ tất cả (AND) — SS-101. */
  amenities?: string;
  /** Điểm đánh giá tối thiểu, thang 10 (7|8|9) — SS-101. */
  reviewScore?: number;
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
