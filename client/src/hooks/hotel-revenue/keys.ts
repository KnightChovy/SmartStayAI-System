import type {
  HotelRevenueParams,
  HotelWalletParams,
} from '@/types/hotel-revenue.types';
import type { PerformanceQueryParams } from '@/types/platform-manager.types';

/** Query keys cho khu vực doanh thu/ví/hiệu suất của 1 khách sạn (Hotel Partner). */
export const hotelRevenueKeys = {
  /** Gốc — dùng khi cần invalidate cả doanh thu lẫn ví (vd sau khi hoàn tiền được chuyển khoản). */
  all: ['hotel-revenue'] as const,
  revenue: (hotelId: string, params: HotelRevenueParams) =>
    ['hotel-revenue', 'revenue', hotelId, params] as const,
  wallet: (hotelId: string, params: HotelWalletParams) =>
    ['hotel-revenue', 'wallet', hotelId, params] as const,
  analytics: (hotelId: string, params: PerformanceQueryParams) =>
    ['hotel-revenue', 'analytics', hotelId, params] as const,
};
