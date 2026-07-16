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
  // ----- Chi tiết bổ sung kiểu booking.com (Pha 1 DB) -----
  postalCode?: string | null;
  phone?: string | null;
  email?: string | null;
  totalFloors?: number | null;
  builtYear?: number | null;
  renovationYear?: number | null;
  isSmokingAllowed?: boolean;
  petsPolicy?: 'not_allowed' | 'allowed' | 'on_request' | null;
  // Chính sách huỷ THẬT (quyết định tiền hoàn). Service ghi vào hotel.settings.cancellation.
  settings?: { cancellation: { freeUntilHours: number; latePenalty: 'first_night' | 'full' } };
  // Đoạn mô tả chính sách huỷ cho khách đọc — KHÔNG ảnh hưởng tới tiền (xem `settings` ở trên).
  cancellationPolicy?: string | null;
  childrenPolicy?: string | null;
  minGuestAge?: number | null;
  securityDepositAmount?: number | null;
  languagesSpoken?: string[]; // Json — gửi [] để xoá hết
  maxLengthOfStay?: number | null;
}

/** Ảnh khách sạn để thêm (URL đã upload trước qua POST /v1/uploads). */
export interface HotelImageInput {
  url: string;
  imageCategory: 'cover' | 'exterior' | 'room';
  caption?: string;
  isPrimary?: boolean;
  sortOrder?: number;
}

/** Một liên hệ của khách sạn (thay thế toàn bộ khi PUT). */
export interface HotelContactInput {
  contactType: 'physical_location' | 'general' | 'availability' | 'invoices';
  name?: string | null;
  jobTitle?: string | null;
  email?: string | null;
  phone?: string | null;
  phoneType?: 'voice' | 'fax' | 'mobile' | null;
}

/** Một điều khoản cho khách ĐỌC — thuần văn bản, không ảnh hưởng tiền (thay thế toàn bộ khi PUT). */
export interface HotelPolicyInput {
  title: string;
  description?: string | null;
  important?: boolean;
}

/** Một khoản thu CỘNG VÀO tiền đơn — engine tính giá đọc cái này (thay thế toàn bộ khi PUT). */
export interface HotelChargeInput {
  chargeType: 'tax' | 'fee';
  name: string;
  amount: number;
  isPercentage?: boolean;
  // Chỉ dùng khi isPercentage = false; tính theo % thì bỏ qua trường này.
  chargeFrequency?: 'per_stay' | 'per_night' | 'per_person' | 'per_person_per_night' | null;
}

/** Một địa điểm lân cận khách sạn (thay thế toàn bộ khi PUT). */
export interface HotelNearbyPlaceInput {
  name: string;
  category: 'attraction' | 'beach' | 'airport' | 'restaurant' | 'public_transport' | 'landmark' | 'nature';
  distance: number;
  distanceUnit: 'km' | 'miles';
  transportType?: 'walk' | 'car' | 'public_transport' | 'taxi' | 'shuttle' | null;
  journeyMinutes?: number | null;
}
