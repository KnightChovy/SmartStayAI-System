import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { dashboardKeys } from '@/hooks/dashboard/keys';
import { dashboardService } from '@/services/dashboard.service';
import type { DashboardRangeParams } from '@/types/dashboard.types';

/** KPI summary theo date-range (`GET /manager/dashboard/summary`). */
export function useDashboardSummary(params: DashboardRangeParams) {
  return useQuery({
    queryKey: dashboardKeys.summary(params),
    queryFn: () => dashboardService.getSummary(params),
    placeholderData: keepPreviousData,
  });
}
