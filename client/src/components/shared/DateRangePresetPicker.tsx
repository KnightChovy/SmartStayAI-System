import { useState } from 'react';
import { CalendarDays, Check } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/cn';
import {
  DEFAULT_PRESETS,
  PRESET_LABELS,
  formatRangeLabel,
  resolvePreset,
  type DateRangeValue,
  type RangePreset,
} from '@/components/shared/date-range-presets';

/**
 * Bảng màu nhấn theo cổng. CỐ Ý viết đủ chuỗi class thay vì nội suy
 * `bg-role-${tone}-light` — Tailwind quét mã nguồn theo văn bản, class động
 * sẽ không được sinh ra và mất màu trong im lặng.
 */
const TONE_CLASS = {
  manager: {
    selected: 'bg-role-manager-light text-role-manager-primary',
    focus: 'focus:border-role-manager-primary',
    button: 'bg-role-manager-primary hover:bg-role-manager-secondary',
  },
  partner: {
    selected: 'bg-role-partner-light text-role-partner-primary',
    focus: 'focus:border-role-partner-primary',
    button: 'bg-role-partner-primary hover:bg-role-partner-secondary',
  },
} as const;

export type RangePickerTone = keyof typeof TONE_CLASS;

interface DateRangePresetPickerProps {
  value: DateRangeValue;
  preset: RangePreset;
  onChange: (range: DateRangeValue, preset: RangePreset) => void;
  /** Bộ preset hiển thị (mặc định: bộ của Platform Revenue). `custom` luôn có ở cuối. */
  presets?: RangePreset[];
  tone?: RangePickerTone;
  className?: string;
}

/**
 * Bộ chọn khoảng thời gian dùng chung cho các trang báo cáo: chọn preset áp dụng ngay,
 * "Custom" mở hai ô ngày + nút Apply (validate from ≤ to).
 *
 * Thay cho cặp `<DatePicker>` From/To rời rạc — cặp đó tự chặn nhau bằng `min`/`max`
 * (ô From không cho chọn quá ô To và ngược lại), nên muốn dời cả kỳ thì phải sửa đúng
 * thứ tự hai ô; sai thứ tự là lịch chặn hết ngày và trông như bộ lọc bị hỏng.
 */
export function DateRangePresetPicker({
  value,
  preset,
  onChange,
  presets = DEFAULT_PRESETS,
  tone = 'manager',
  className,
}: DateRangePresetPickerProps) {
  const [open, setOpen] = useState(false);
  const [showCustom, setShowCustom] = useState(preset === 'custom');
  const [customFrom, setCustomFrom] = useState(value.from);
  const [customTo, setCustomTo] = useState(value.to);
  const t = TONE_CLASS[tone];

  // Đồng bộ ô custom ngay trong handler mở popover (không dùng effect — tránh cascading render).
  const handleOpenChange = (next: boolean) => {
    if (next) {
      setCustomFrom(value.from);
      setCustomTo(value.to);
      setShowCustom(preset === 'custom');
    }
    setOpen(next);
  };

  const customError =
    customFrom && customTo && new Date(customFrom) > new Date(customTo)
      ? 'End date must be after start date'
      : '';

  const options = presets.includes('custom')
    ? presets
    : [...presets, 'custom' as const];

  const handlePreset = (p: RangePreset) => {
    if (p === 'custom') {
      setShowCustom(true);
      return; // mở khu vực custom, chưa áp dụng
    }
    setShowCustom(false);
    onChange(resolvePreset(p), p);
    setOpen(false);
  };

  const applyCustom = () => {
    if (customError || !customFrom || !customTo) return;
    onChange({ from: customFrom, to: customTo }, 'custom');
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
        >
          <CalendarDays className="h-4 w-4 text-slate-500" />
          {formatRangeLabel(value)}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className={cn('w-72 p-3', className)}>
        <div className="space-y-1">
          {options.map(p => (
            <button
              key={p}
              type="button"
              onClick={() => handlePreset(p)}
              className={cn(
                'flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors',
                preset === p || (p === 'custom' && showCustom)
                  ? cn(t.selected, 'font-semibold')
                  : 'text-slate-600 hover:bg-slate-50'
              )}
            >
              {PRESET_LABELS[p]}
              {preset === p && <Check className="h-4 w-4" />}
            </button>
          ))}
        </div>

        {showCustom && (
          <div className="mt-3 space-y-2 border-t border-slate-100 pt-3">
            <div className="grid grid-cols-2 gap-2">
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-slate-500">From</span>
                <input
                  type="date"
                  value={customFrom}
                  onChange={e => setCustomFrom(e.target.value)}
                  className={cn(
                    'h-9 rounded-lg border border-slate-200 px-2 text-sm outline-none',
                    t.focus
                  )}
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-slate-500">To</span>
                <input
                  type="date"
                  value={customTo}
                  onChange={e => setCustomTo(e.target.value)}
                  className={cn(
                    'h-9 rounded-lg border border-slate-200 px-2 text-sm outline-none',
                    t.focus
                  )}
                />
              </label>
            </div>
            {customError && <p className="text-xs text-red-500">{customError}</p>}
            <button
              type="button"
              onClick={applyCustom}
              disabled={!!customError || !customFrom || !customTo}
              className={cn(
                'w-full rounded-lg px-3 py-2 text-sm font-medium text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50',
                t.button
              )}
            >
              Apply
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
