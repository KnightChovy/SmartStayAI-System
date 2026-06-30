/**
 * TanStack Query key factory — nguồn duy nhất sinh query key cho toàn app.
 *
 * Dùng để vừa cache vừa invalidate nhất quán:
 *   queryKeys.hotels.detail(id)        → ['hotels', 'detail', id]
 *   queryKeys.bookings.mine(params)    → ['bookings', 'mine', params]
 *
 * `as const` để TS giữ nguyên tuple literal, an toàn khi so khớp key.
 */
import type { HotelReviewsParams } from '@/types/reviews.type';
import type { HotelSearchParams, RoomTypeParams } from '@/types/hotels.type';
import type { MyBookingsParams } from '@/types/bookings.type';
import type { AmenityParams } from '@/types/amenities.type';

export const queryKeys = {
  auth: {
    all: () => ['auth'] as const,
    me: () => ['auth', 'me'] as const,
  },
  users: {
    all: () => ['users'] as const,
    profile: (userId: string) => ['users', 'profile', userId] as const,
  },
  hotels: {
    all: () => ['hotels'] as const,
    search: (params: HotelSearchParams) => ['hotels', 'search', params] as const,
    detail: (hotelId: string) => ['hotels', 'detail', hotelId] as const,
    roomTypes: (hotelId: string, params: RoomTypeParams) =>
      ['hotels', hotelId, 'room-types', params] as const,
  },
  amenities: {
    all: () => ['amenities'] as const,
    list: (params: AmenityParams) => ['amenities', 'list', params] as const,
  },
  bookings: {
    all: () => ['bookings'] as const,
    mine: (params: MyBookingsParams) => ['bookings', 'mine', params] as const,
    detail: (bookingId: string) => ['bookings', 'detail', bookingId] as const,
  },
  reviews: {
    all: () => ['reviews'] as const,
    byHotel: (params: HotelReviewsParams) => ['reviews', 'hotel', params] as const,
    detail: (reviewId: string) => ['reviews', 'detail', reviewId] as const,
  },
  geo: {
    all: () => ['geo'] as const,
    geocode: (query: string) => ['geo', 'geocode', query] as const,
  },
} as const;
