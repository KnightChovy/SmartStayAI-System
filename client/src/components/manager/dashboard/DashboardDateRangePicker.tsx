import { useState } from 'react';
import { CalendarDays, Check } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/cn';
import { toDateInputValue } from '@/utils/formatDate';
import type { DashboardRange } from '@/types/dashboard.types';

export type DashboardPreset =
  | 'today'
  | 'thisWeek'
  | 'thisMonth'
  | 'thisQuarter'
  | 'thisYear'
  | 'custom';

const PRESETS: { value: DashboardPreset; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'thisWeek', label: 'This Week' },
  { value: 'thisMonth', label: 'This Month' },
  { value: 'thisQuarter', label: 'This Quarter' },
  { value: 'thisYear', label: 'This Year' },
  { value: 'custom', label: 'Custom' },
];

/** Range (YYYY-MM-DD) cho một preset dựa trên ngày hiện tại (local). Tuần bắt đầu thứ 2. */
export function resolveDashboardPreset(preset: Exclude<DashboardPreset, 'custom'>): DashboardRange {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const day = (yy: number, mm: number, dd: number) => toDateInputValue(new Date(yy, mm, dd));

  switch (preset) {
    case 'today':
      return { from: toDateInputValue(now), to: toDateInputValue(now) };
    case 'thisWeek': {
      const dow = (now.getDay() + 6) % 7; // 0 = Monday
      const monday = new Date(now);
      monday.setDate(now.getDate() - dow);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      return { from: toDateInputValue(monday), to: toDateInputValue(sunday) };
    }
    case 'thisQuarter': {
      const q = Math.floor(m / 3);
      return { from: day(y, q * 3, 1), to: day(y, q * 3 + 3, 0) };
    }
    case 'thisYear':
      return { from: day(y, 0, 1), to: day(y, 11, 31) };
    case 'thisMonth':
    default:
      return { from: day(y, m, 1), to: day(y, m + 1, 0) };
  }
}

function formatRangeLabel({ from, to }: DashboardRange): string {
  const f = new Date(from);
  const t = new Date(to);
  if (Number.isNaN(f.getTime()) || Number.isNaN(t.getTime())) return 'Select date range';
  const dd = (x: Date) => String(x.getDate()).padStart(2, '0');
  const mm = (x: Date) => String(x.getMonth() + 1).padStart(2, '0');
  if (from === to) return `${dd(f)}/${mm(f)}/${f.getFullYear()}`;
  const left =
    f.getFullYear() === t.getFullYear() ? `${dd(f)}/${mm(f)}` : `${dd(f)}/${mm(f)}/${f.getFullYear()}`;
  return `${left} – ${dd(t)}/${mm(t)}/${t.getFullYear()}`;
}

interface DashboardDateRangePickerProps {
  value: DashboardRange;
  preset: DashboardPreset;
  onChange: (range: DashboardRange, preset: DashboardPreset) => void;
}

/** Global date-range picker cho dashboard (AC-3): preset + custom + validate from ≤ to. */
export function DashboardDateRangePicker({ value, preset, onChange }: DashboardDateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const [customFrom, setCustomFrom] = useState(value.from);
  const [customTo, setCustomTo] = useState(value.to);

  const customError =
    customFrom && customTo && new Date(customFrom) > new Date(customTo)
      ? 'End date must be after start date'
      : '';

  const handlePreset = (p: DashboardPreset) => {
    if (p === 'custom') {
      setCustomFrom(value.from);
      setCustomTo(value.to);
      return;
    }
    onChange(resolveDashboardPreset(p), p);
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
          className="flex items-center gap-2 text-sm font-medium text-slate-700 border border-slate-200 rounded-lg px-3 py-2 hover:bg-slate-50 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-role-manager-primary"
        >
          <CalendarDays className="w-4 h-4 text-slate-500" />
          {formatRangeLabel(value)}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 p-3">
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
