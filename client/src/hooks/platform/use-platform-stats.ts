import { useQuery } from '@tanstack/react-query';
import { platformService } from '@/services/platform.service';
import { queryKeys } from '@/constants/queryKeys';

/** Số liệu tổng của sàn (`GET /v1/platform/stats`) — SS-002/004. */
export function usePlatformStats() {
  return useQuery({
    queryKey: queryKeys.platform.stats,
    queryFn: () => platformService.getStats(),
    staleTime: 10 * 60 * 1000,
  });
}
