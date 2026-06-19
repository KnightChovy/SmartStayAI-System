/**
 * Factory key cho TanStack Query. Mọi hook query/mutation dùng chung các key
 * ở đây để invalidate/cache nhất quán, tránh gõ tay string rời rạc.
 */
export const queryKeys = {
  hotels: {
    all: ['hotels'] as const,
    /** Khách sạn của partner đang đăng nhập (`GET /hotels/mine`). */
    mine: ['hotels', 'mine'] as const,
    /** Chi tiết khách sạn cho chủ/manager (`GET /hotels/:id/manage`). */
    managed: (hotelId: string) => ['hotels', 'managed', hotelId] as const,
    search: (params: object) => ['hotels', 'search', params] as const,
    detail: (hotelId: string) => ['hotels', 'detail', hotelId] as const,
    roomTypes: (hotelId: string, params: object) =>
      ['hotels', hotelId, 'room-types', params] as const,
  },
  bookings: {
    all: ['bookings'] as const,
    mine: (params: object) => ['bookings', 'mine', params] as const,
    detail: (bookingId: string) => ['bookings', 'detail', bookingId] as const,
  },
  profile: {
    me: ['profile', 'me'] as const,
  },
  reviews: {
    mine: ['reviews', 'mine'] as const,
  },
  loyalty: {
    account: ['loyalty', 'account'] as const,
  },
  vouchers: {
    available: ['vouchers', 'available'] as const,
  },
  notifications: {
    all: ['notifications'] as const,
  },
} as const;
