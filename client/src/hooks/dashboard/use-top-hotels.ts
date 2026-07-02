import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { dashboardKeys } from '@/hooks/dashboard/keys';
import { dashboardService } from '@/services/dashboard.service';
import type { DashboardRangeParams } from '@/types/dashboard.types';

/** Top hotels theo revenue trong range (`GET /manager/dashboard/top-hotels`). */
export function useTopHotels(params: DashboardRangeParams) {
  return useQuery({
    queryKey: dashboardKeys.topHotels(params),
    queryFn: () => dashboardService.getTopHotels(params),
    placeholderData: keepPreviousData,
  });
}
