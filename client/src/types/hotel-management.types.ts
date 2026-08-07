/**
 * Types cho Hotel Management (`/v1/hotels/:hotelId/...`) — quản trị loại phòng,
 * phòng vật lý và pricing rules cho chủ khách sạn / user có quyền `manageHotels`.
 * Lưu ý: các field Decimal của Prisma (basePrice, areaSqm, adjustmentValue)
 * serialize qua JSON thành **string**; Date/DateTime trả về ISO 8601 string.
 */

import type { Amenity, HotelImage, PetsPolicy } from '@/types/hotel.types';

// ─── Shared enums ─────────────────────────────────────────────────────────────

export type RoomStatus = 'available' | 'occupied' | 'maintenance' | 'cleaning';
export type RuleType = 'seasonal' | 'weekend' | 'occupancy' | 'early_bird';
export type AdjustmentType = 'percentage' | 'fixed';
export type SizeUnit = 'sqm' | 'sqft';
export type BedType = 'single' | 'double' | 'queen' | 'king' | 'sofa_bed' | 'bunk';
/** 0 = Chủ nhật ... 6 = Thứ bảy. */
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

// ─── Room types (quản trị) ────────────────────────────────────────────────────

export interface ManagedRoomTypeImage {
  id: string;
  roomTypeId: string;
  url: string;
  isPrimary: boolean;
  sortOrder: number;
  createdAt: string;
}

/** Bảng nối N-N giữa room type và amenity (kèm chi tiết amenity + isFree/quantity như BE). */
export interface RoomTypeAmenityLink {
  roomTypeId: string;
  amenityId: string;
  createdAt: string;
  isFree?: boolean;
  quantity?: number | null;
  amenity: Amenity;
}

/** Loại phòng dạng quản trị (`GET /:hotelId/room-types/manage`, gồm cả isActive: false). */
export interface ManagedRoomType {
  id: string;
  hotelId: string;
  name: string;
  description: string | null;
  maxOccupancy: number;
  basePrice: string;
  areaSqm: string | null;
  bedType: string | null;
  viewType: string | null;
  isActive: boolean;
  // ----- Chi tiết bổ sung kiểu booking.com (Pha 1 DB) -----
  maxAdults?: number | null;
  maxChildren?: number | null;
  sizeUnit?: SizeUnit | null;
  isNonSmoking?: boolean | null;
  hasPrivateBathroom?: boolean | null;
  hasBalcony?: boolean | null;
  createdAt: string;
  updatedAt: string;
  images: ManagedRoomTypeImage[];
  amenities: RoomTypeAmenityLink[];
  _count: { rooms: number };
}

// ─── Hotel detail (quản trị) ──────────────────────────────────────────────────

/** Bảng nối N-N giữa hotel và amenity (kèm chi tiết amenity). */
export interface HotelAmenityLink {
  hotelId: string;
  amenityId: string;
  createdAt: string;
  amenity: Amenity;
}

/** Tiện nghi đã gán cho khách sạn (`GET /hotels/:id/amenities`) — kèm isFree/quantity + catalog. */
export interface HotelAmenity {
  hotelId: string;
  amenityId: string;
  isFree: boolean;
  quantity: number | null;
  createdAt?: string;
  amenity: Amenity;
}

/** Một dòng gán tiện nghi khi lưu (mặc định isFree=true, quantity=null). */
export interface AmenityAssignment {
  amenityId: string;
  isFree?: boolean;
  quantity?: number | null;
}

/** Body cho `PUT /hotels/:id/amenities` — thay thế TOÀN BỘ tiện nghi ([] = bỏ hết). */
export interface SetHotelAmenitiesDto {
  amenities: AmenityAssignment[];
}

/**
 * Chi tiết khách sạn cho chủ/manager (`GET /hotels/:id/manage`) — xem được cả
 * khi chưa listed. Gồm toàn bộ ảnh, amenity và danh sách loại phòng.
 */
export interface ManagedHotel {
  id: string;
  partnerId: string;
  name: string;
  slug: string | null;
  description: string | null;
  address: string;
  city: string;
  country: string;
  businessType: string | null;
  district: string | null;
  ward: string | null;
  latitude: string | null;
  longitude: string | null;
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
  /** Decimal -> string. */
  securityDepositAmount?: string | null;
  languagesSpoken?: string[] | null;
  maxLengthOfStay?: number | null;
  /**
   * JSON tự do của khách sạn. Chứa `cancellation.tiers` — chính sách huỷ THẬT (quyết định tiền
   * hoàn), khác `cancellationPolicy` ở trên (chỉ là đoạn văn cho khách đọc).
   *
   * ⚠️ Endpoint quản trị (`GET /hotels/:id/manage`) trả **JSON thô**, KHÔNG parse sẵn như
   * `cancellationRule` của endpoint công khai — nên phía partner phải tự bóc (xem
   * `readCancellationTiers`).
   */
  settings?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  images: HotelImage[];
  amenities: HotelAmenityLink[];
  roomTypes: ManagedRoomType[];
}

// ─── Physical rooms ───────────────────────────────────────────────────────────

export interface RoomTypeRef {
  id: string;
  name: string;
}

export interface PhysicalRoom {
  id: string;
  hotelId: string;
  roomTypeId: string;
  roomNumber: string;
  floor: number | null;
  status: RoomStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  roomType: RoomTypeRef;
}

// ─── Pricing rules ────────────────────────────────────────────────────────────

export interface PricingRule {
  id: string;
  hotelId: string;
  /** null = áp cho cả khách sạn. */
  roomTypeId: string | null;
  name: string;
  ruleType: RuleType;
  startDate: string;
  endDate: string;
  dayOfWeek: number[];
  occupancyThreshold: number | null;
  adjustmentType: AdjustmentType;
  /** Decimal -> string; ÂM = giảm giá. */
  adjustmentValue: string;
  priority: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  /** null nếu rule áp cho cả khách sạn. */
  roomType: RoomTypeRef | null;
}

// ─── Request DTOs ─────────────────────────────────────────────────────────────

export interface CreateRoomTypeDto {
  name: string;
  maxOccupancy: number;
  basePrice: number;
  description?: string | null;
  areaSqm?: number | null;
  bedType?: string | null;
  viewType?: string | null;
  isActive?: boolean;
  // ----- Chi tiết bổ sung kiểu booking.com (Pha 1 DB) — đều tuỳ chọn -----
  maxAdults?: number;
  maxChildren?: number;
  sizeUnit?: SizeUnit;
  isNonSmoking?: boolean;
  hasPrivateBathroom?: boolean;
  hasBalcony?: boolean;
}

/** Body partial — tối thiểu 1 field. */
export type UpdateRoomTypeDto = Partial<CreateRoomTypeDto>;

export interface RoomTypeImageInput {
  url: string;
  isPrimary?: boolean;
  sortOrder?: number;
}

export interface AddRoomTypeImagesDto {
  images: RoomTypeImageInput[];
}

/**
 * Body cho `PUT /:hotelId/room-types/:roomTypeId/amenities` — thay thế TOÀN BỘ tiện nghi
 * ([] = bỏ hết). Khớp BE: mỗi dòng là object có amenityId + isFree/quantity tuỳ chọn.
 */
export interface ReplaceAmenitiesDto {
  amenities: AmenityAssignment[];
}

export interface CreateRoomDto {
  roomTypeId: string;
  roomNumber: string;
  floor?: number | null;
  status?: RoomStatus;
  notes?: string | null;
}

/** Body partial — tối thiểu 1 field; KHÔNG đổi roomTypeId. */
export interface UpdateRoomDto {
  roomNumber?: string;
  floor?: number | null;
  status?: RoomStatus;
  notes?: string | null;
}

export interface CreatePricingRuleDto {
  name: string;
  ruleType: RuleType;
  startDate: string;
  endDate: string;
  adjustmentType: AdjustmentType;
  adjustmentValue: number;
  roomTypeId?: string | null;
  dayOfWeek?: number[];
  /** Bắt buộc khi ruleType = 'occupancy'. */
  occupancyThreshold?: number | null;
  priority?: number;
  isActive?: boolean;
}

/** Body partial — tối thiểu 1 field. */
export type UpdatePricingRuleDto = Partial<CreatePricingRuleDto>;

// ─── Query params ─────────────────────────────────────────────────────────────

export interface RoomListParams {
  status?: RoomStatus;
  roomTypeId?: string;
  /** "field:asc" | "field:desc" (mặc định "roomNumber:asc"). */
  sortBy?: string;
  limit?: number;
  page?: number;
}

export interface PricingRuleListParams {
  roomTypeId?: string;
  isActive?: boolean;
}
