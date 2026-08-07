import type { HotelBookingsParams, StaffRoomsParams } from '@/types/staff.types';

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
  rooms: (hotelId: string, params: StaffRoomsParams = {}) =>
    ['staff', 'rooms', hotelId, params] as const,
  roomBlocks: (hotelId: string, includeResolved: boolean) =>
    ['staff', 'room-blocks', hotelId, includeResolved] as const,
  /** Lưới tồn kho theo đêm (`GET .../inventory/calendar`). */
  inventory: (hotelId: string, from: string, to: string) =>
    ['staff', 'inventory', hotelId, from, to] as const,
  /** Booking phủ khoảng ngày — nguồn thô cho bản đồ phòng, không dùng cho lưới. */
  inventoryBookings: (hotelId: string, from: string, to: string) =>
    ['staff', 'inventory-bookings', hotelId, from, to] as const,
};
