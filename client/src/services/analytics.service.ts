import { api } from '@/lib/api';
import type {
  PlatformAnalytics,
  PlatformAnalyticsParams,
} from '@/types/analytics.types';

function cleanParams<T extends object>(params: T): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(params).filter(
      ([, v]) => v !== undefined && v !== null && v !== ''
    )
  );
}

export const analyticsService = {
  /** Báo cáo analytics toàn sàn — `GET /platform-manager/analytics` (viewPlatformStats). */
  async getPlatformAnalytics(
    params: PlatformAnalyticsParams = {}
  ): Promise<PlatformAnalytics> {
    const { data } = await api.get<PlatformAnalytics>(
      '/platform-manager/analytics',
      { params: cleanParams(params) }
    );
    return data;
  },
};
