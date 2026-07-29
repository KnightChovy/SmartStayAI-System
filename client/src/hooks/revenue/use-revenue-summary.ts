import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { revenueKeys } from '@/hooks/revenue/keys';
import { revenueService } from '@/services/revenue.service';
import type { RevenueRangeParams } from '@/types/revenue.types';

/** KPI cards doanh thu toàn sàn theo khoảng thời gian (`GET /admin/revenue`). */
export function useRevenueSummary(params: RevenueRangeParams) {
  return useQuery({
    queryKey: revenueKeys.summary(params),
    queryFn: () => revenueService.getSummary(params),
    placeholderData: keepPreviousData,
  });
}
