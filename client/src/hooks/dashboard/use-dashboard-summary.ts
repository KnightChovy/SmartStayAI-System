import { useMemo } from 'react';
import { useAdminOverview, useAdminRevenue } from '@/hooks/admin';
import { usePlatformPartners } from '@/hooks/platform-manager';
import {
  changePct,
  fillRevenueSeries,
  previousRange,
  seriesGroupBy,
} from '@/hooks/dashboard/range';
import type { DashboardRange, DashboardSummary } from '@/types/dashboard.types';

/**
 * 4 KPI của dashboard, gộp từ 4 request thật.
 *
 * Mức độ "theo khoảng thời gian" của từng KPI KHÔNG đồng đều, vì BE chỉ có MỘT endpoint
 * hiểu from/to:
 *  • revenue  — `/admin/revenue`: có value + comparison + series ⇒ đủ cả % và sparkline.
 *  • bookings — `/admin/revenue` có `series[].bookingCount`, nhưng `comparison` KHÔNG kèm
 *               bookingCount ⇒ phải gọi endpoint lần 2 cho kỳ trước rồi tự tính %.
 *  • activeUsers / hotelPartners — chỉ có snapshot TOÀN THỜI GIAN (`/admin/overview`,
 *               `/platform-manager/partners`) ⇒ không %, không sparkline, gắn `note` để UI nói rõ.
 */
export function useDashboardSummary(range: DashboardRange) {
  const prev = useMemo(() => previousRange(range), [range]);
  const groupBy = seriesGroupBy(range);

  const current = useAdminRevenue({ from: range.from, to: range.to, groupBy });
  const previous = useAdminRevenue({ from: prev.from, to: prev.to, groupBy });
  const overview = useAdminOverview();
  // limit:1 — chỉ cần `totalResults`, không kéo cả danh sách đối tác về.
  const partners = usePlatformPartners({ limit: 1 });

  const data = useMemo<DashboardSummary | undefined>(() => {
    if (!current.data || !previous.data || !overview.data || !partners.data) {
      return undefined;
    }

    const series = fillRevenueSeries(current.data.series, range, groupBy);

    return {
      range,
      previousRange: prev,
      kpis: {
        hotelPartners: {
          value: partners.data.totalResults,
          changePct: null,
          sparkline: [],
          note: 'All time',
        },
        activeUsers: {
          // BE không có khái niệm "active user" — gần nhất là tổng user chưa bị khoá.
          value: Math.max(0, overview.data.users.total - overview.data.users.suspended),
          changePct: null,
          sparkline: [],
          note: 'All time · excludes suspended',
        },
        bookings: {
          value: current.data.summary.bookingCount,
          changePct: changePct(
            current.data.summary.bookingCount,
            previous.data.summary.bookingCount
          ),
          sparkline: series.map(p => p.bookings),
        },
        revenue: {
          // `netPlatformRevenue` (hoa hồng sàn thực thu) chứ KHÔNG phải `gmv`: GMV là tiền
          // khách trả cho khách sạn — gắn nhãn "Platform Revenue" lên GMV là phóng đại
          // doanh thu của sàn lên nhiều lần.
          value: Number(current.data.summary.netPlatformRevenue),
          // Ưu tiên comparison của BE (nguồn có thẩm quyền) thay vì tự tính từ lần gọi thứ 2.
          changePct: current.data.comparison?.change.netRevenuePct ?? null,
          sparkline: series.map(p => p.netRevenue),
        },
      },
    };
  }, [current.data, previous.data, overview.data, partners.data, range, prev, groupBy]);

  return {
    data,
    isLoading:
      current.isLoading || previous.isLoading || overview.isLoading || partners.isLoading,
    isError: current.isError || previous.isError || overview.isError || partners.isError,
    refetch: () => {
      void current.refetch();
      void previous.refetch();
      void overview.refetch();
      void partners.refetch();
    },
  };
}
