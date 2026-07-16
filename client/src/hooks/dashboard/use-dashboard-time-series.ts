import { useMemo } from 'react';
import { useAdminRevenue } from '@/hooks/admin';
import { fillRevenueSeries, seriesGroupBy } from '@/hooks/dashboard/range';
import type { DashboardRange, DashboardTimeSeries } from '@/types/dashboard.types';

/**
 * Chuỗi doanh thu + booking theo khoảng đang chọn — `GET /admin/revenue`.
 * Đây là endpoint DUY NHẤT của BE vừa nhận from/to vừa trả series, nên cả chart Revenue
 * lẫn chart Bookings đều dùng chung một request này.
 *
 * `groupBy` tự chọn theo độ dài khoảng; series của BE thưa nên phải vá 0 (xem `fillRevenueSeries`).
 */
export function useDashboardTimeSeries(range: DashboardRange) {
  const groupBy = seriesGroupBy(range);
  const query = useAdminRevenue({ from: range.from, to: range.to, groupBy });

  const data = useMemo<DashboardTimeSeries | undefined>(() => {
    if (!query.data) return undefined;
    return {
      groupBy,
      points: fillRevenueSeries(query.data.series, range, groupBy),
    };
  }, [query.data, range, groupBy]);

  return {
    data,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: () => {
      void query.refetch();
    },
  };
}
