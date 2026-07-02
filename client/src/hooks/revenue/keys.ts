import type {
  RevenueByPartnerParams,
  RevenueBreakdownParams,
  RevenueRangeParams,
  RevenueTimeSeriesParams,
} from '@/types/revenue.types';

export const revenueKeys = {
  summary: (params: RevenueRangeParams) => ['revenue', 'summary', params] as const,
  timeSeries: (params: RevenueTimeSeriesParams) =>
    ['revenue', 'time-series', params] as const,
  byPartner: (params: RevenueByPartnerParams) =>
    ['revenue', 'by-partner', params] as const,
  breakdown: (params: RevenueBreakdownParams) =>
    ['revenue', 'breakdown', params] as const,
};
