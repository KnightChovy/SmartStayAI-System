import type {
  PerformanceQueryParams,
  PlatformBookingsParams,
  PlatformPartnersParams,
} from '@/types/platform-manager.types';

export const platformManagerKeys = {
  partners: (params: PlatformPartnersParams) =>
    ['platform-manager', 'partners', params] as const,
  bookings: (params: PlatformBookingsParams) =>
    ['platform-manager', 'bookings', params] as const,
  performance: (params: PerformanceQueryParams) =>
    ['platform-manager', 'performance', params] as const,
  hotelPerformance: (hotelId: string, params: PerformanceQueryParams) =>
    ['platform-manager', 'hotel-performance', hotelId, params] as const,
};
