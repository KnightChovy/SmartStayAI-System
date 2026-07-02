import { useQuery } from '@tanstack/react-query';
import { dashboardKeys } from '@/hooks/dashboard/keys';
import { dashboardService } from '@/services/dashboard.service';

/** Recent activity / audit log (`GET /manager/dashboard/activity`). */
export function useRecentActivity() {
  return useQuery({
    queryKey: dashboardKeys.activity,
    queryFn: () => dashboardService.getRecentActivity(),
  });
}
