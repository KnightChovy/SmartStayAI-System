/**
 * Types cho Hotel Management (`/v1/hotels/:hotelId/...`) — quản trị loại phòng,
 * phòng vật lý và pricing rules cho chủ khách sạn / user có quyền `manageHotels`.
 * Lưu ý: các field Decimal của Prisma (basePrice, areaSqm, adjustmentValue)
 * serialize qua JSON thành **string**; Date/DateTime trả về ISO 8601 string.
 */

import type { Amenity, HotelImage } from '@/types/hotel.types';

// ─── Shared enums ─────────────────────────────────────────────────────────────

export type RoomStatus = 'available' | 'occupied' | 'maintenance' | 'cleaning';
export type RuleType = 'seasonal' | 'weekend' | 'occupancy' | 'early_bird';
export type AdjustmentType = 'percentage' | 'fixed';
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

/** Bảng nối N-N giữa room type và amenity (kèm chi tiết amenity). */
export interface RoomTypeAmenityLink {
  roomTypeId: string;
  amenityId: string;
  createdAt: string;
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

export interface ReplaceAmenitiesDto {
  /** UUID[]; phải unique; [] = bỏ hết. */
  amenityIds: string[];
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
