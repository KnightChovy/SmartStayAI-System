import { useState } from 'react';
import { CalendarDays, Check } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/cn';
import { toDateInputValue } from '@/utils/formatDate';
import type { DateRange } from '@/types/revenue.types';

export type RangePreset =
  | 'today'
  | 'thisMonth'
  | 'lastMonth'
  | 'thisQuarter'
  | 'thisYear'
  | 'custom';

const PRESETS: { value: RangePreset; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'thisMonth', label: 'This month' },
  { value: 'lastMonth', label: 'Last month' },
  { value: 'thisQuarter', label: 'This quarter' },
  { value: 'thisYear', label: 'This year' },
  { value: 'custom', label: 'Custom' },
];

/** Tính range (YYYY-MM-DD) cho một preset dựa trên ngày hiện tại (local). */
export function resolvePreset(preset: Exclude<RangePreset, 'custom'>): DateRange {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const d = (yy: number, mm: number, dd: number) => toDateInputValue(new Date(yy, mm, dd));

  switch (preset) {
    case 'today':
      return { from: toDateInputValue(now), to: toDateInputValue(now) };
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
function formatRangeLabel({ from, to }: DateRange): string {
  const f = new Date(from);
  const t = new Date(to);
  if (Number.isNaN(f.getTime()) || Number.isNaN(t.getTime())) return 'Select date range';
  const dd = (x: Date) => String(x.getDate()).padStart(2, '0');
  const mm = (x: Date) => String(x.getMonth() + 1).padStart(2, '0');
  const left =
    f.getFullYear() === t.getFullYear()
      ? `${dd(f)}/${mm(f)}`
      : `${dd(f)}/${mm(f)}/${f.getFullYear()}`;
  return `${left} – ${dd(t)}/${mm(t)}/${t.getFullYear()}`;
}

interface RevenueDateRangePickerProps {
  value: DateRange;
  preset: RangePreset;
  onChange: (range: DateRange, preset: RangePreset) => void;
  className?: string;
}

/**
 * Global date-range picker (AC-1): preset + tùy chọn + validation from ≤ to.
 * Chọn preset áp dụng ngay; "Tùy chọn" mở 2 ô ngày và nút Áp dụng.
 */
export function RevenueDateRangePicker({
  value,
  preset,
  onChange,
  className,
}: RevenueDateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const [customFrom, setCustomFrom] = useState(value.from);
  const [customTo, setCustomTo] = useState(value.to);

  const customError =
    customFrom && customTo && new Date(customFrom) > new Date(customTo)
      ? 'End date must be after start date'
      : '';

  const handlePreset = (p: RangePreset) => {
    if (p === 'custom') {
      setCustomFrom(value.from);
      setCustomTo(value.to);
      return; // mở khu vực custom, chưa áp dụng
    }
    onChange(resolvePreset(p), p);
    setOpen(false);
  };

  const applyCustom = () => {
    if (customError || !customFrom || !customTo) return;
    onChange({ from: customFrom, to: customTo }, 'custom');
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-2 text-sm font-medium text-slate-700 border border-slate-200 rounded-lg px-3 py-2 hover:bg-slate-50 transition-colors"
        >
          <CalendarDays className="w-4 h-4 text-slate-500" />
          {formatRangeLabel(value)}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className={cn('w-72 p-3', className)}>
        <div className="space-y-1">
          {PRESETS.map(p => (
            <button
              key={p.value}
              type="button"
              onClick={() => handlePreset(p.value)}
              className={cn(
                'flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors',
                preset === p.value
                  ? 'bg-role-manager-light text-role-manager-primary font-semibold'
                  : 'text-slate-600 hover:bg-slate-50'
              )}
            >
              {p.label}
              {preset === p.value && <Check className="w-4 h-4" />}
            </button>
          ))}
        </div>

        {preset === 'custom' && (
          <div className="mt-3 border-t border-slate-100 pt-3 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-slate-500">From</span>
                <input
                  type="date"
                  value={customFrom}
                  max={customTo || undefined}
                  onChange={e => setCustomFrom(e.target.value)}
                  className="h-9 rounded-lg border border-slate-200 px-2 text-sm outline-none focus:border-role-manager-primary"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-slate-500">To</span>
                <input
                  type="date"
                  value={customTo}
                  min={customFrom || undefined}
                  onChange={e => setCustomTo(e.target.value)}
                  className="h-9 rounded-lg border border-slate-200 px-2 text-sm outline-none focus:border-role-manager-primary"
                />
              </label>
            </div>
            {customError && <p className="text-xs text-red-500">{customError}</p>}
            <button
              type="button"
              onClick={applyCustom}
              disabled={!!customError || !customFrom || !customTo}
              className="w-full rounded-lg bg-role-manager-primary px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-role-manager-secondary disabled:cursor-not-allowed disabled:opacity-50"
            >
              Apply
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
