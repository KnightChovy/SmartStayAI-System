import type { DashboardRangeParams } from '@/types/dashboard.types';

export const dashboardKeys = {
  summary: (p: DashboardRangeParams) => ['dashboard', 'summary', p] as const,
  timeSeries: (p: DashboardRangeParams) => ['dashboard', 'time-series', p] as const,
  verifications: (p: DashboardRangeParams) => ['dashboard', 'verifications', p] as const,
  alerts: ['dashboard', 'alerts'] as const,
  topHotels: (p: DashboardRangeParams) => ['dashboard', 'top-hotels', p] as const,
  activity: ['dashboard', 'activity'] as const,
  search: (q: string) => ['dashboard', 'search', q] as const,
};
