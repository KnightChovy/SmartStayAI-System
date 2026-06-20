import type { HotelBookingsParams } from '@/types/staff.types';

/** Shared query key factory for the staff portal (scoped per active hotel). */
export const staffKeys = {
  all: ['staff'] as const,
  hotels: ['staff', 'hotels'] as const,
  bookings: (hotelId: string, params: HotelBookingsParams) =>
    ['staff', 'bookings', hotelId, params] as const,
  booking: (hotelId: string, bookingId: string) =>
    ['staff', 'booking', hotelId, bookingId] as const,
  housekeeping: (hotelId: string, status?: string) =>
    ['staff', 'housekeeping', hotelId, status ?? 'all'] as const,
  rooms: (hotelId: string) => ['staff', 'rooms', hotelId] as const,
};
