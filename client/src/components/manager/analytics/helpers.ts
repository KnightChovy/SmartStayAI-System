import type { PlatformAnalyticsTimePoint } from '@/types/analytics.types';

export const PIE_COLORS = ['#2563EB', '#3B82F6', '#60A5FA', '#93C5FD', '#BFDBFE'];

/** Cỡ mẫu tối thiểu để không cảnh báo "mẫu nhỏ" ở conversion rate (A3). */
export const SMALL_SAMPLE = 10;
/** Số điểm khác 0 tối thiểu để vẽ xu hướng, tránh đường phẳng gây hiểu nhầm (A2). */
export const MIN_TREND_POINTS = 3;
/** Số hotel hiển thị mặc định trước khi bấm "Show all" (A5). */
export const TOP_HOTELS_PREVIEW = 5;

const numberFmt = new Intl.NumberFormat('en-US');
export const formatNumber = (n: number) => numberFmt.format(n);
export const formatPercent = (rate: number) => `${(rate * 100).toFixed(1)}%`;

/** Kiểu props tối giản cho custom Tooltip của recharts v3. */
export interface ChartTooltipProps {
  active?: boolean;
  label?: string | number;
  payload?: Array<{
    name?: string;
    value?: number;
    color?: string;
    dataKey?: string | number;
    payload?: Record<string, unknown>;
  }>;
}

/** % thay đổi kỳ cuối vs kỳ trước đó cho một trường của time-series (A1). */
export function periodChange(
  series: PlatformAnalyticsTimePoint[],
  key: 'bookings' | 'confirmedBookings' | 'newUsers'
): number | null {
  if (series.length < 2) return null;
  const last = series[series.length - 1][key];
  const prev = series[series.length - 2][key];
  if (prev === 0) return null;
  return Math.round(((last - prev) / prev) * 1000) / 10;
}

/** % thay đổi của conversion rate (confirmed/bookings) kỳ cuối vs kỳ trước (A1). */
export function conversionChange(series: PlatformAnalyticsTimePoint[]): number | null {
  if (series.length < 2) return null;
  const l = series[series.length - 1];
  const p = series[series.length - 2];
  if (!l.bookings || !p.bookings) return null;
  const lc = l.confirmedBookings / l.bookings;
  const pc = p.confirmedBookings / p.bookings;
  if (pc === 0) return null;
  return Math.round(((lc - pc) / pc) * 1000) / 10;
}
