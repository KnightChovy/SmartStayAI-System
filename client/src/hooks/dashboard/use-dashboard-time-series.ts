import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { dashboardKeys } from '@/hooks/dashboard/keys';
import { dashboardService } from '@/services/dashboard.service';
import type { DashboardRangeParams } from '@/types/dashboard.types';

/** Chart 12 tháng: revenue / bookings / active users (`GET /manager/dashboard/timeseries`). */
export function useDashboardTimeSeries(params: DashboardRangeParams) {
  return useQuery({
    queryKey: dashboardKeys.timeSeries(params),
    queryFn: () => dashboardService.getTimeSeries(params),
    placeholderData: keepPreviousData,
  });
}
