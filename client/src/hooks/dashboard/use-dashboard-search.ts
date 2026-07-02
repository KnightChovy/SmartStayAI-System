import { useQuery } from '@tanstack/react-query';
import { dashboardKeys } from '@/hooks/dashboard/keys';
import { dashboardService } from '@/services/dashboard.service';

/** Global search phân nhóm (hotels/users/bookings). Chỉ chạy khi query ≥ 2 ký tự (AC-6). */
export function useDashboardSearch(query: string) {
  const q = query.trim();
  return useQuery({
    queryKey: dashboardKeys.search(q),
    queryFn: () => dashboardService.search(q),
    enabled: q.length >= 2,
  });
}
