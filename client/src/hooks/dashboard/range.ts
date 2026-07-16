import type { AdminRevenueSeriesPoint } from '@/types/admin.types';
import type { DashboardRange } from '@/types/dashboard.types';

const DAY_MS = 24 * 60 * 60 * 1000;

const toKey = (d: Date): string => d.toISOString().slice(0, 10);
const parse = (key: string): Date => new Date(`${key}T00:00:00.000Z`);

/** Số ngày của khoảng (tính cả hai đầu — BE coi `to` là inclusive). */
export function rangeLengthDays(range: DashboardRange): number {
  return (
    Math.round(
      (parse(range.to).getTime() - parse(range.from).getTime()) / DAY_MS
    ) + 1
  );
}

export function previousRange(range: DashboardRange): DashboardRange {
  const days = rangeLengthDays(range);
  const prevTo = new Date(parse(range.from).getTime() - DAY_MS);
  const prevFrom = new Date(prevTo.getTime() - (days - 1) * DAY_MS);
  return { from: toKey(prevFrom), to: toKey(prevTo) };
}

/** Khoảng dài thì gộp theo tháng cho chart đọc được (ngưỡng ~2 tháng). */
export function seriesGroupBy(range: DashboardRange): 'day' | 'month' {
  return rangeLengthDays(range) > 62 ? 'month' : 'day';
}

/** % thay đổi so với kỳ trước; `null` khi kỳ trước = 0 (chia 0 vô nghĩa) — khớp cách BE tính. */
export function changePct(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return Math.round(((current - previous) / previous) * 100 * 100) / 100;
}

/** Mọi mốc thời gian trong khoảng, theo granularity — dùng để vá lỗ hổng chuỗi. */
function periodsIn(range: DashboardRange, groupBy: 'day' | 'month'): string[] {
  const out: string[] = [];
  const end = parse(range.to);
  const cursor = parse(range.from);

  if (groupBy === 'day') {
    while (cursor.getTime() <= end.getTime()) {
      out.push(toKey(cursor));
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
    return out;
  }

  cursor.setUTCDate(1);
  while (cursor.getTime() <= end.getTime()) {
    out.push(toKey(cursor).slice(0, 7));
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }
  return out;
}

export interface FilledPoint {
  period: string;
  /** Tổng tiền khách trả (doanh thu của các khách sạn). */
  gmv: number;
  /** Hoa hồng platform thực thu (doanh thu của chính sàn). */
  netRevenue: number;
  bookings: number;
}

export function fillRevenueSeries(
  series: AdminRevenueSeriesPoint[],
  range: DashboardRange,
  groupBy: 'day' | 'month'
): FilledPoint[] {
  const byPeriod = new Map(series.map(p => [p.period, p]));
  return periodsIn(range, groupBy).map(period => {
    const hit = byPeriod.get(period);
    return {
      period,
      gmv: hit ? Number(hit.gmv) : 0,
      netRevenue: hit ? Number(hit.netPlatformRevenue) : 0,
      bookings: hit ? hit.bookingCount : 0,
    };
  });
}
