/**
 * Types cho màn "All bookings" của Hotel Partner — bookings gộp toàn bộ khách sạn
 * partner sở hữu (`GET /hotel-partners/me/bookings`). Response cùng shape với
 * màn giám sát toàn sàn nên tái dùng `PlatformBooking`.
 */
import type { Paginated } from '@/types/api.types';
import type {
  PlatformBooking,
  PlatformBookingStatus,
} from '@/types/platform-manager.types';

export interface PartnerBookingsParams {
  status?: PlatformBookingStatus;
  /** Thu hẹp về 1 khách sạn của partner. */
  hotelId?: string;
  fromDate?: string;
  toDate?: string;
  /** Khớp bookingCode / tên / email khách. */
  search?: string;
  sortBy?: string;
  limit?: number;
  page?: number;
}

export type PartnerBookingsResponse = Paginated<PlatformBooking>;
