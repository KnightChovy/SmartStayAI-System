import { DateRangePresetPicker } from '@/components/shared/DateRangePresetPicker';
import {
  DEFAULT_PRESETS,
  type RangePreset,
} from '@/components/shared/date-range-presets';
import type { DateRange } from '@/types/revenue.types';

export type { RangePreset };

interface RevenueDateRangePickerProps {
  value: DateRange;
  preset: RangePreset;
  onChange: (range: DateRange, preset: RangePreset) => void;
  className?: string;
}

/**
 * Global date-range picker của trang Platform Revenue (AC-1).
 * Thân component nằm ở `components/shared/DateRangePresetPicker` để cổng partner
 * dùng chung một hành vi — ở đây chỉ ghim tông màu manager và bộ preset mặc định.
 */
export function RevenueDateRangePicker({
  value,
  preset,
  onChange,
  className,
}: RevenueDateRangePickerProps) {
  return (
    <DateRangePresetPicker
      value={value}
      preset={preset}
      onChange={onChange}
      presets={DEFAULT_PRESETS}
      tone="manager"
      className={className}
    />
  );
}
