import type { PlatformAnalyticsParams } from '@/types/analytics.types';

export const analyticsKeys = {
  platform: (params: PlatformAnalyticsParams) =>
    ['analytics', 'platform', params] as const,
};
