import { useMemo } from 'react';
import { usePlatformAnalytics } from '@/hooks/analytics';
import type { UsersGrowthSeries } from '@/types/dashboard.types';

/** Số tháng hiển thị — endpoint chỉ nhận số bucket lùi từ hiện tại, không nhận from/to. */
const MONTHS = 12;

/**
 * Người dùng MỚI theo tháng — `GET /platform-manager/analytics?period=month&range=12`.
 *
 * Hai điều UI phải nói thẳng với người xem:
 *  • Đây là user MỚI trong tháng, không phải user đang hoạt động (BE không có metric "active").
 *  • Chuỗi luôn là 12 tháng gần nhất — endpoint không nhận from/to nên chart này KHÔNG đi theo
 *    date-range picker của dashboard.
 * Chuỗi đã được BE gap-fill sẵn (khác `/admin/revenue`) nên không cần vá 0.
 */
export function useUsersGrowth() {
  const query = usePlatformAnalytics({ period: 'month', range: MONTHS });

  const data = useMemo<UsersGrowthSeries | undefined>(() => {
    if (!query.data) return undefined;
    return {
      points: query.data.timeSeries.map(p => ({ period: p.period, newUsers: p.newUsers })),
    };
  }, [query.data]);

  return {
    data,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: () => {
      void query.refetch();
    },
  };
}
