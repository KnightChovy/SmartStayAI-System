import { useState } from 'react';
import { CalendarDays } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/cn';
import { formatDate, toDateInputValue } from '@/utils/formatDate';
import { parseDateValue } from '@/utils/stayDates';
import { SegmentLabel } from './SearchSegment';
import { SEGMENT_CLASS, segmentValueClass } from './segment-styles';

interface DateSegmentProps {
  label: string;
  /** `YYYY-MM-DD`, `''` khi chưa chọn. */
  value: string;
  onChange: (value: string) => void;
  /** Chặn mọi ngày trước mốc này (`YYYY-MM-DD`). */
  min?: string;
  /** Chặn mọi ngày sau mốc này (`YYYY-MM-DD`) — vd giới hạn số đêm tối đa của một booking. */
  max?: string;
  placeholder: string;
  className?: string;
}

/**
 * Ô chọn ngày của thanh tìm kiếm hero — **không** dùng `ui/date-picker` (nó là nút có
 * viền + icon, dành cho form), mà mở thẳng `Calendar` từ chính ô segment để cả thanh
 * chỉ còn một lớp khung duy nhất.
 */
export default function DateSegment({
  label,
  value,
  onChange,
  min,
  max,
  placeholder,
  className,
}: DateSegmentProps) {
  const [open, setOpen] = useState(false);
  const selected = parseDateValue(value);
  const minDate = parseDateValue(min);
  const maxDate = parseDateValue(max);

  const disabledMatchers = [
    ...(minDate ? [{ before: minDate }] : []),
    ...(maxDate ? [{ after: maxDate }] : []),
  ];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" className={cn(SEGMENT_CLASS, className)}>
          <SegmentLabel icon={CalendarDays}>{label}</SegmentLabel>
          <span className={segmentValueClass(!!selected)}>
            {selected ? formatDate(selected) : placeholder}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0">
        <Calendar
          mode="single"
          selected={selected}
          defaultMonth={selected ?? minDate ?? undefined}
          startMonth={minDate ?? undefined}
          endMonth={maxDate ?? undefined}
          disabled={disabledMatchers.length ? disabledMatchers : undefined}
          onSelect={day => {
            onChange(day ? toDateInputValue(day) : '');
            if (day) setOpen(false);
          }}
          autoFocus
        />
      </PopoverContent>
    </Popover>
  );
}
