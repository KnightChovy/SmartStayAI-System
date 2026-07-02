import { useQuery } from '@tanstack/react-query';
import { dashboardKeys } from '@/hooks/dashboard/keys';
import { dashboardService } from '@/services/dashboard.service';

/** Policy violation alerts (`GET /manager/dashboard/alerts`). */
export function useDashboardAlerts() {
  return useQuery({
    queryKey: dashboardKeys.alerts,
    queryFn: () => dashboardService.getAlerts(),
  });
}
