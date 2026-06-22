import type { Amenity } from '@/types/hotel.types';
import type { RoomListParams, PricingRuleListParams } from '@/types/hotel-management.types';

/** Factory key TanStack Query cho domain Hotel Management. */
export const hotelManagementKeys = {
  all: ['hotel-management'] as const,
  roomTypes: (hotelId: string) =>
    [...hotelManagementKeys.all, 'room-types', hotelId] as const,
  rooms: (hotelId: string, params: RoomListParams) =>
    [...hotelManagementKeys.all, 'rooms', hotelId, params] as const,
  pricingRules: (hotelId: string, params: PricingRuleListParams) =>
    [...hotelManagementKeys.all, 'pricing-rules', hotelId, params] as const,
  amenities: (category?: Amenity['category']) =>
    [...hotelManagementKeys.all, 'amenities', category ?? 'all'] as const,
};
