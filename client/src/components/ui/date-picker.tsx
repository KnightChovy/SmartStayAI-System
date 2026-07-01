import * as React from 'react';
import { CalendarIcon, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/cn';
import { formatDate, toDateInputValue } from '@/utils/formatDate';

export interface DatePickerProps {
  /** Giá trị dạng `YYYY-MM-DD` (khớp value cũ của <input type="date">). */
  value?: string | null;
  /** Trả về `YYYY-MM-DD`, hoặc `''` khi xoá. */
  onChange: (value: string) => void;
  /** Chặn chọn ngày trước `min` (YYYY-MM-DD). */
  min?: string | null;
  /** Chặn chọn ngày sau `max` (YYYY-MM-DD). */
  max?: string | null;
  disabled?: boolean;
  placeholder?: string;
  id?: string;
  ariaInvalid?: boolean;
  className?: string;

  clearable?: boolean;
}

function parseDay(value?: string | null): Date | undefined {
  if (!value) return undefined;
  const d = new Date(`${value}T00:00:00`);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

export function DatePicker({
  value,
  onChange,
  min,
  max,
  disabled,
  placeholder = 'Chọn ngày',
  id,
  ariaInvalid,
  className,
  clearable = true,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const selected = parseDay(value);
  const minDate = parseDay(min);
  const maxDate = parseDay(max);

  const startMonth = minDate ?? new Date(1920, 0, 1);
  const endMonth = maxDate ?? new Date(2100, 11, 31);

  const disabledMatchers = [
    ...(minDate ? [{ before: minDate }] : []),
    ...(maxDate ? [{ after: maxDate }] : []),
  ];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          disabled={disabled}
          aria-invalid={ariaInvalid}
          className={cn(
            'h-11 w-full justify-start bg-white text-left font-normal hover:bg-white',

            'aria-expanded:border-ring aria-expanded:bg-white aria-expanded:ring-3 aria-expanded:ring-ring/50',
            !selected && 'text-muted-foreground',
            className
          )}
        >
          <CalendarIcon className="mr-2 size-4 shrink-0 opacity-70" />
          {selected ? formatDate(selected) : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          defaultMonth={selected ?? maxDate ?? undefined}
          captionLayout="dropdown"
          startMonth={startMonth}
          endMonth={endMonth}
          disabled={disabledMatchers.length ? disabledMatchers : undefined}
          onSelect={day => {
            onChange(day ? toDateInputValue(day) : '');
            if (day) setOpen(false);
          }}
          autoFocus
        />
        {clearable && value ? (
          <div className="border-t border-outline-variant/40 p-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-full text-slate-500"
              onClick={() => {
                onChange('');
                setOpen(false);
              }}
            >
              <X className="size-3.5" />
              Xoá ngày
            </Button>
          </div>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}
