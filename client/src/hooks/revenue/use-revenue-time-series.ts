import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { revenueKeys } from '@/hooks/revenue/keys';
import { revenueService } from '@/services/revenue.service';
import type { RevenueTimeSeriesParams } from '@/types/revenue.types';

/** Time-series Revenue/Commission toàn sàn (`GET /admin/revenue`). */
export function useRevenueTimeSeries(params: RevenueTimeSeriesParams) {
  return useQuery({
    queryKey: revenueKeys.timeSeries(params),
    queryFn: () => revenueService.getTimeSeries(params),
    placeholderData: keepPreviousData,
  });
}
