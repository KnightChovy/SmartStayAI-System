import { useQuery } from '@tanstack/react-query';

import { analyticsKeys } from '@/hooks/analytics/keys';
import { analyticsService } from '@/services/analytics.service';
import type { PlatformAnalyticsParams } from '@/types/analytics.types';

export function usePlatformAnalytics(params: PlatformAnalyticsParams = {}) {
  return useQuery({
    queryKey: analyticsKeys.platform(params),
    queryFn: () => analyticsService.getPlatformAnalytics(params),
  });
}
