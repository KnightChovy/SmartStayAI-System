import type { Paginated } from '@/types/api.types';

/** Trạng thái đối tác (khớp enum `PartnerStatus` của backend). */
export type PlatformPartnerStatus =
  | 'pending'
  | 'approved'
  | 'suspended'
  | 'rejected';

/** Chủ tài khoản của một đối tác. */
export interface PlatformPartnerOwner {
  id: string;
  fullName: string | null;
  email: string;
}

/**
 * Một đối tác (hotel_partner) toàn sàn — `GET /platform-manager/partners`.
 * `commissionRate` là Decimal được backend serialize thành string.
 */
export interface PlatformPartner {
  id: string;
  businessName: string;
  status: PlatformPartnerStatus;
  commissionRate: string;
  contactEmail: string | null;
  contactPhone: string | null;
  approvedAt: string | null;
  createdAt: string;
  owner: PlatformPartnerOwner | null;
  _count: { hotels: number };
}

export interface PlatformPartnersParams {
  search?: string;
  status?: PlatformPartnerStatus;
  limit?: number;
  page?: number;
}

export type PlatformPartnersResponse = Paginated<PlatformPartner>;

// ─── Performance (leaderboard + per-hotel) ───────────────────────────────────

/** Khoảng thời gian báo cáo performance (mặc định 90 ngày gần nhất). */
export interface PerformanceQueryParams {
  from?: string;
  to?: string;
}

export interface PerformanceWindow {
  from: string;
  to: string;
}

/**
 * Một dòng trong bảng xếp hạng hiệu suất. `occupancyRate`/`cancellationRate` ở thang 0..1,
 * `avgRating` thang 0..5, `avgResponseMinutes` tính bằng phút. `null` = chưa đủ dữ liệu.
 */
export interface HotelLeaderboardRow {
  hotelId: string;
  hotelName: string;
  city: string;
  score: number | null;
  occupancyRate: number | null;
  cancellationRate: number | null;
  avgRating: number | null;
  avgResponseMinutes: number | null;
}

export interface PerformanceLeaderboard {
  window: PerformanceWindow;
  hotels: HotelLeaderboardRow[];
}

export interface HotelPerformanceMetrics {
  occupancyRate: number | null;
  cancellationRate: number | null;
  avgRating: number | null;
  avgResponseMinutes: number | null;
  totalBookings: number;
  cancelledBookings: number;
  reviewCount: number;
}

/** Điểm thành phần đã chuẩn hoá về thang 0..100 (null nếu thiếu dữ liệu). */
export interface HotelPerformanceScores {
  rating: number | null;
  occupancy: number | null;
  cancellation: number | null;
  response: number | null;
}

export interface HotelPerformance {
  hotelId: string;
  hotelName: string;
  city: string;
  window: PerformanceWindow;
  metrics: HotelPerformanceMetrics;
  scores: HotelPerformanceScores;
  /** Điểm tổng hợp có trọng số 0..100 (rating 40% / occupancy 25% / cancel 20% / response 15%). */
  score: number | null;
}

// ─── Bookings (giám sát toàn sàn) ────────────────────────────────────────────

/** Trạng thái booking (khớp enum `BookingStatus` của backend). */
export type PlatformBookingStatus =
  | 'pending'
  | 'confirmed'
  | 'checked_in'
  | 'checked_out'
  | 'cancelled'
  | 'no_show';

export interface PlatformBookingCustomer {
  id: string;
  fullName: string | null;
  email: string;
  phone: string | null;
}

export interface PlatformBookingHotel {
  id: string;
  name: string;
  city: string;
}

export interface PlatformBookingRoomType {
  id: string;
  name: string;
}

/**
 * Một booking trong màn giám sát toàn sàn — `GET /platform-manager/bookings`.
 * Trường Decimal (`totalAmount`) được backend serialize thành string;
 * `checkInDate`/`checkOutDate`/`createdAt` là ISO string.
 */
export interface PlatformBooking {
  id: string;
  bookingCode: string;
  checkInDate: string;
  checkOutDate: string;
  numNights: number;
  numGuests: number;
  totalAmount: string;
  status: PlatformBookingStatus;
  createdAt: string;
  customer: PlatformBookingCustomer | null;
  hotel: PlatformBookingHotel;
  roomType: PlatformBookingRoomType | null;
}

export interface PlatformBookingsParams {
  status?: PlatformBookingStatus;
  hotelId?: string;
  partnerId?: string;
  fromDate?: string;
  toDate?: string;
  search?: string;
  sortBy?: string;
  limit?: number;
  page?: number;
}

export type PlatformBookingsResponse = Paginated<PlatformBooking>;
