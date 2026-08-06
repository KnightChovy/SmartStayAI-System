/**
 * Preset khoảng thời gian dùng chung cho các trang báo cáo (Platform Revenue, Partner Revenue).
 * Tách khỏi file component để `react-refresh/only-export-components` không nổi
 * (một file component chỉ được export component).
 */
import { toDateInputValue } from '@/utils/formatDate';

/** Khoảng thời gian (inclusive), dạng YYYY-MM-DD. */
export interface DateRangeValue {
  from: string;
  to: string;
}

export type RangePreset =
  | 'today'
  | 'last7'
  | 'last30'
  | 'thisMonth'
  | 'lastMonth'
  | 'thisQuarter'
  | 'thisYear'
  | 'custom';

export const PRESET_LABELS: Record<RangePreset, string> = {
  today: 'Today',
  last7: 'Last 7 days',
  last30: 'Last 30 days',
  thisMonth: 'This month',
  lastMonth: 'Last month',
  thisQuarter: 'This quarter',
  thisYear: 'This year',
  custom: 'Custom',
};

/** Bộ preset mặc định — giữ đúng danh sách cũ của trang Platform Revenue. */
export const DEFAULT_PRESETS: RangePreset[] = [
  'today',
  'thisMonth',
  'lastMonth',
  'thisQuarter',
  'thisYear',
  'custom',
];

/** Tính range (YYYY-MM-DD) cho một preset dựa trên ngày hiện tại (local). */
export function resolvePreset(
  preset: Exclude<RangePreset, 'custom'>
): DateRangeValue {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const d = (yy: number, mm: number, dd: number) =>
    toDateInputValue(new Date(yy, mm, dd));
  const daysAgo = (n: number) =>
    toDateInputValue(new Date(y, m, now.getDate() - n));

  switch (preset) {
    case 'today':
      return { from: toDateInputValue(now), to: toDateInputValue(now) };
    case 'last7':
      return { from: daysAgo(6), to: toDateInputValue(now) };
    case 'last30':
      return { from: daysAgo(29), to: toDateInputValue(now) };
    case 'lastMonth':
      return { from: d(y, m - 1, 1), to: d(y, m, 0) };
    case 'thisQuarter': {
      const q = Math.floor(m / 3);
      return { from: d(y, q * 3, 1), to: d(y, q * 3 + 3, 0) };
    }
    case 'thisYear':
      return { from: d(y, 0, 1), to: d(y, 11, 31) };
    case 'thisMonth':
    default:
      return { from: d(y, m, 1), to: d(y, m + 1, 0) };
  }
}

/** Nhãn range gọn: "01/06 – 30/06/2026" (cùng năm) hoặc đầy đủ hai năm. */
export function formatRangeLabel({ from, to }: DateRangeValue): string {
  const f = new Date(from);
  const t = new Date(to);
  if (Number.isNaN(f.getTime()) || Number.isNaN(t.getTime()))
    return 'Select date range';
  const dd = (x: Date) => String(x.getDate()).padStart(2, '0');
  const mm = (x: Date) => String(x.getMonth() + 1).padStart(2, '0');
  const left =
    f.getFullYear() === t.getFullYear()
      ? `${dd(f)}/${mm(f)}`
      : `${dd(f)}/${mm(f)}/${f.getFullYear()}`;
  return `${left} – ${dd(t)}/${mm(t)}/${t.getFullYear()}`;
}
