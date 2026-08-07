import type { HotelReviewsParams } from '@/types/reviews.type';
import type { HotelSearchParams, RoomTypeParams } from '@/types/hotels.type';
import type { MyBookingsParams } from '@/types/bookings.type';
import type { AmenityParams } from '@/types/amenities.type';
import type {
  ConversationsParams,
  HousekeepingParams,
  StaffBookingsParams,
  StaffRoomsParams,
} from '@/types/staff.type';

export const queryKeys = {
  auth: {
    all: () => ['auth'] as const,
    me: () => ['auth', 'me'] as const,
  },
  users: {
    all: () => ['users'] as const,
    me: () => ['users', 'me'] as const,
    profile: (userId: string) => ['users', 'profile', userId] as const,
  },
  hotels: {
    all: () => ['hotels'] as const,
    search: (params: HotelSearchParams) =>
      ['hotels', 'search', params] as const,
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
    byHotel: (params: HotelReviewsParams) =>
      ['reviews', 'hotel', params] as const,
    detail: (reviewId: string) => ['reviews', 'detail', reviewId] as const,
    mine: () => ['reviews', 'mine'] as const,
    hotelStats: (hotelId: string) => ['reviews', 'stats', hotelId] as const,
  },
  geo: {
    all: () => ['geo'] as const,
    geocode: (query: string) => ['geo', 'geocode', query] as const,
  },

  wallet: {
    all: () => ['wallet'] as const,
    mine: () => ['wallet', 'mine'] as const,
  },

  messages: {
    all: () => ['messages'] as const,
    mine: () => ['messages', 'mine'] as const,
    thread: (hotelId: string | null) => ['messages', 'thread', hotelId] as const,
  },

  staff: {
    all: () => ['staff'] as const,
    myHotels: () => ['staff', 'my-hotels'] as const,
    bookings: (hotelId: string, params: StaffBookingsParams) =>
      ['staff', hotelId, 'bookings', params] as const,
    booking: (hotelId: string, bookingId: string) =>
      ['staff', hotelId, 'booking', bookingId] as const,
    lookup: (hotelId: string, voucherCode: string) =>
      ['staff', hotelId, 'lookup', voucherCode] as const,
    housekeeping: (hotelId: string, params: HousekeepingParams) =>
      ['staff', hotelId, 'housekeeping', params] as const,
    rooms: (hotelId: string, params: StaffRoomsParams) =>
      ['staff', hotelId, 'rooms', params] as const,
    roomBlocks: (hotelId: string, includeResolved: boolean) =>
      ['staff', hotelId, 'room-blocks', includeResolved] as const,
    inventoryCalendar: (hotelId: string, from: string, to: string) =>
      ['staff', hotelId, 'inventory-calendar', from, to] as const,
    conversations: (hotelId: string, params: ConversationsParams) =>
      ['staff', hotelId, 'conversations', params] as const,
    conversation: (hotelId: string, conversationId: string) =>
      ['staff', hotelId, 'conversation', conversationId] as const,
  },
} as const;
