/**
 * Types cho các bộ thông tin "replace-all" của khách sạn (Hotel Management):
 *   - Contacts        `GET/PUT /hotels/:id/contacts`
 *   - Policies / fees  `GET/PUT /hotels/:id/policies`
 *   - Nearby places    `GET/PUT /hotels/:id/nearby-places`
 *   - Bed config       `GET/PUT /hotels/:id/room-types/:roomTypeId/beds`
 * Mỗi PUT thay thế TOÀN BỘ tập; gửi mảng rỗng = xoá hết.
 * Field Decimal (amount, distance) được backend serialize thành **string** khi trả về.
 */
import type { BedType } from '@/types/hotel-management.types';

// ─── Contacts ────────────────────────────────────────────────────────────────

export type ContactType = 'physical_location' | 'general' | 'availability' | 'invoices';
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

// ─── Policies / fees ─────────────────────────────────────────────────────────

export type PolicyType = 'cancellation' | 'tax' | 'fee' | 'parking' | 'internet' | 'deposit';
export type ChargeFrequency =
  | 'per_stay'
  | 'per_night'
  | 'per_person'
  | 'per_person_per_night';

// ─── Charges (khoản thu tính tiền) ───────────────────────────────────────────

/**
 * Loại khoản thu CỘNG VÀO tiền đơn (bảng `hotel_charges` của BE).
 *
 * ⚠️ BE đã tách `hotel_policies` làm hai (commit `db05ed4`, migration
 * `split_policy_and_charge`): `HotelPolicy` giờ là điều khoản THUẦN VĂN BẢN cho khách đọc,
 * còn thuế/phí engine tính tiền nằm ở `HotelCharge`. Muốn tính thuế thì đọc `hotel.charges`,
 * KHÔNG đọc `hotel.policies` nữa.
 */
export type ChargeType = 'tax' | 'fee';

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

export interface HotelPolicy {
  id: string;
  hotelId: string;
  policyType: PolicyType;
  code: string | null;
  description: string | null;
  /** Decimal -> string. */
  amount: string | null;
  isPercentage: boolean;
  chargeFrequency: ChargeFrequency | null;
  minAge: number | null;
  maxAge: number | null;
}

export interface HotelPolicyInput {
  policyType: PolicyType;
  code?: string | null;
  description?: string | null;
  amount?: number | null;
  isPercentage?: boolean;
  chargeFrequency?: ChargeFrequency | null;
  minAge?: number | null;
  maxAge?: number | null;
}

export interface SetHotelPoliciesDto {
  policies: HotelPolicyInput[];
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
export type TransportType = 'walk' | 'car' | 'public_transport' | 'taxi' | 'shuttle';

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
