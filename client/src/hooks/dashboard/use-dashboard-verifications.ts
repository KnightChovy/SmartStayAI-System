import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { dashboardKeys } from '@/hooks/dashboard/keys';
import { dashboardService } from '@/services/dashboard.service';
import type { DashboardRangeParams } from '@/types/dashboard.types';

/** Recent verifications trong range (`GET /manager/dashboard/verifications`). */
export function useDashboardVerifications(params: DashboardRangeParams) {
  return useQuery({
    queryKey: dashboardKeys.verifications(params),
    queryFn: () => dashboardService.getVerifications(params),
    placeholderData: keepPreviousData,
  });
}
