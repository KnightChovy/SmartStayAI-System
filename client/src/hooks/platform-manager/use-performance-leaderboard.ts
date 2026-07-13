import { useQuery } from '@tanstack/react-query';

import { platformManagerKeys } from '@/hooks/platform-manager/keys';
import { platformManagerService } from '@/services/platform-manager.service';
import type { PerformanceQueryParams } from '@/types/platform-manager.types';

export function usePerformanceLeaderboard(params: PerformanceQueryParams = {}) {
  return useQuery({
    queryKey: platformManagerKeys.performance(params),
    queryFn: () => platformManagerService.getPerformanceLeaderboard(params),
  });
}
