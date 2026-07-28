import type { BedType } from '@/types/hotel-management.types';

// ─── Contacts ────────────────────────────────────────────────────────────────

export type ContactType =
  | 'physical_location'
  | 'general'
  | 'availability'
  | 'invoices';
export type PhoneType = 'voice' | 'fax' | 'mobile';

export interface HotelContact {
  id: string;
  hotelId: string;
  contactType: ContactType;
  name: string | null;
  jobTitle: string | null;
  email: string | null;
  phone: string | null;
  phoneType: PhoneType | null;
}

/** Một dòng contact khi lưu (replace-all). */
export interface HotelContactInput {
  contactType: ContactType;
  name?: string | null;
  jobTitle?: string | null;
  email?: string | null;
  phone?: string | null;
  phoneType?: PhoneType | null;
}

export interface SetHotelContactsDto {
  contacts: HotelContactInput[];
}

// ─── Policies (điều khoản văn bản) ───────────────────────────────────────────

/**
 * Một điều khoản của khách sạn — **thuần văn bản cho khách đọc**, không mang số tiền nào.
 *
 * ⚠️ BE đã tách `hotel_policies` làm hai (commit `db05ed4`, migration
 * `split_policy_and_charge`): các cột `policyType`/`code`/`amount`/`isPercentage`/
 * `chargeFrequency`/`minAge`/`maxAge` **đã bị DROP**. Thuế/phí chuyển hết sang
 * `hotel_charges` (xem `HotelCharge` bên dưới).
 */
export interface HotelPolicy {
  id: string;
  hotelId: string;
  /** Tiêu đề điều khoản, vd "Chính sách huỷ phòng" (BE: required, ≤ 200 ký tự). */
  title: string;
  /** Nội dung điều khoản (BE: ≤ 2000 ký tự). */
  description: string | null;
  /** Điều khoản quan trọng — khách hay bỏ sót, FE nên làm nổi bật. */
  important: boolean;
}

export interface HotelPolicyInput {
  title: string;
  description?: string | null;
  important?: boolean;
}

export interface SetHotelPoliciesDto {
  policies: HotelPolicyInput[];
}

// ─── Charges (khoản thu tính tiền) ───────────────────────────────────────────

/** Loại khoản thu CỘNG VÀO tiền đơn (bảng `hotel_charges` của BE). */
export type ChargeType = 'tax' | 'fee';

export type ChargeFrequency =
  | 'per_stay'
  | 'per_night'
  | 'per_person'
  | 'per_person_per_night';

/** Một khoản thu của khách sạn (`GET /hotels/:id` → `charges[]`). Decimal → string. */
export interface HotelCharge {
  id: string;
  hotelId: string;
  chargeType: ChargeType;
  /** Tên hiển thị trên bảng phân tích giá, vd "VAT 8%". */
  name: string;
  amount: string;
  /** `true` ⇒ `amount` là % trên tiền phòng và `chargeFrequency` bị BỎ QUA. */
  isPercentage: boolean;
  chargeFrequency: ChargeFrequency | null;
}

/**
 * Một khoản thu khi lưu (replace-all).
 *
 * ⚠️ BE **cấm** gửi `chargeFrequency` khi `isPercentage = true` (Joi `forbidden`) và
 * **bắt buộc** khi `isPercentage = false` — phần trăm luôn tính trên tiền phòng cả kỳ nên
 * kèm tần suất chỉ khiến người dùng tưởng "8% mỗi đêm" trong khi engine không nhân theo đêm.
 */
export interface HotelChargeInput {
  chargeType: ChargeType;
  name: string;
  amount: number;
  isPercentage?: boolean;
  chargeFrequency?: ChargeFrequency;
}

export interface SetHotelChargesDto {
  charges: HotelChargeInput[];
}

// ─── Nearby places ───────────────────────────────────────────────────────────

export type NearbyCategory =
  | 'attraction'
  | 'beach'
  | 'airport'
  | 'restaurant'
  | 'public_transport'
  | 'landmark'
  | 'nature';
export type DistanceUnit = 'km' | 'miles';
export type TransportType =
  | 'walk'
  | 'car'
  | 'public_transport'
  | 'taxi'
  | 'shuttle';

export interface HotelNearbyPlace {
  id: string;
  hotelId: string;
  name: string;
  category: NearbyCategory;
  /** Decimal -> string. */
  distance: string;
  distanceUnit: DistanceUnit;
  transportType: TransportType | null;
  journeyMinutes: number | null;
}

export interface HotelNearbyPlaceInput {
  name: string;
  category: NearbyCategory;
  distance: number;
  distanceUnit: DistanceUnit;
  transportType?: TransportType | null;
  journeyMinutes?: number | null;
}

export interface SetHotelNearbyPlacesDto {
  nearbyPlaces: HotelNearbyPlaceInput[];
}

// ─── Bed config (theo room type) ─────────────────────────────────────────────

export interface RoomBed {
  id: string;
  roomTypeId: string;
  bedType: BedType;
  quantity: number;
  createdAt: string;
}

export interface RoomBedInput {
  bedType: BedType;
  quantity?: number;
}

export interface SetRoomBedsDto {
  beds: RoomBedInput[];
}
