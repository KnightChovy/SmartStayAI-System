import type { HotelRevenueParams } from '@/types/hotel-revenue.types';
import type { PerformanceQueryParams } from '@/types/platform-manager.types';

/** Query keys cho khu vực doanh thu/ví/hiệu suất của 1 khách sạn (Hotel Partner). */
export const hotelRevenueKeys = {
  /** Gốc — dùng khi cần invalidate cả doanh thu lẫn ví (vd sau khi tạo/duyệt yêu cầu rút). */
  all: ['hotel-revenue'] as const,
  revenue: (hotelId: string, params: HotelRevenueParams) =>
    ['hotel-revenue', 'revenue', hotelId, params] as const,
  /** Ví chỉ còn số dư nên khoá không mang params nữa. */
  wallet: (hotelId: string) => ['hotel-revenue', 'wallet', hotelId] as const,
  analytics: (hotelId: string, params: PerformanceQueryParams) =>
    ['hotel-revenue', 'analytics', hotelId, params] as const,
};
