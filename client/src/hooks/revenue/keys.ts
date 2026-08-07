import type { AdminRevenueBreakdownParams } from '@/types/admin.types';
import type {
  RevenueRangeParams,
  RevenueTimeSeriesParams,
} from '@/types/revenue.types';

export const revenueKeys = {
  summary: (params: RevenueRangeParams) => ['revenue', 'summary', params] as const,
  timeSeries: (params: RevenueTimeSeriesParams) =>
    ['revenue', 'time-series', params] as const,
  breakdown: (params: AdminRevenueBreakdownParams) =>
    ['revenue', 'breakdown', params] as const,
};
