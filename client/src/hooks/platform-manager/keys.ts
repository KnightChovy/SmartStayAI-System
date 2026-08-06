import type { PlatformCommissionRequestsParams } from '@/types/commission-rate.types';
import type {
  PerformanceQueryParams,
  PlatformBookingsParams,
  PlatformPartnersParams,
} from '@/types/platform-manager.types';

export const platformManagerKeys = {
  /** Prefix chung của cả cổng — dùng để invalidate rộng sau khi đình chỉ / duyệt đơn. */
  all: ['platform-manager'] as const,
  partners: (params: PlatformPartnersParams) =>
    ['platform-manager', 'partners', params] as const,
  bookings: (params: PlatformBookingsParams) =>
    ['platform-manager', 'bookings', params] as const,
  performance: (params: PerformanceQueryParams) =>
    ['platform-manager', 'performance', params] as const,
  hotelPerformance: (hotelId: string, params: PerformanceQueryParams) =>
    ['platform-manager', 'hotel-performance', hotelId, params] as const,
  commissionRequests: (params: PlatformCommissionRequestsParams) =>
    ['platform-manager', 'commission-requests', params] as const,
  baseCommissionRate: ['platform-manager', 'commission-rate'] as const,
};
