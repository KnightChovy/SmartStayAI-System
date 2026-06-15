import { CalendarDays } from 'lucide-react';
import { cn } from '@/lib/cn';
import { toDateInputValue } from '@/utils/formatDate';

interface DateRangePickerProps {
  checkIn: string;
  checkOut: string;
  onChange: (range: { checkIn: string; checkOut: string }) => void;
  className?: string;
}

/**
 * Chọn ngày nhận/trả bằng input[type=date] gốc.
 * checkIn không được trước hôm nay; checkOut luôn sau checkIn.
 */
export default function DateRangePicker({ checkIn, checkOut, onChange, className }: DateRangePickerProps) {
  const today = toDateInputValue(new Date());

  const handleCheckIn = (value: string) => {
    // Nếu checkOut <= checkIn mới thì đẩy checkOut lên +1 ngày
    let nextOut = checkOut;
    if (!checkOut || new Date(checkOut) <= new Date(value)) {
      const d = new Date(value);
      d.setDate(d.getDate() + 1);
      nextOut = toDateInputValue(d);
    }
    onChange({ checkIn: value, checkOut: nextOut });
  };

  return (
    <div className={cn('grid grid-cols-2 gap-2', className)}>
      <label className="flex flex-col gap-1">
        <span className="flex items-center gap-1.5 text-xs font-semibold text-on-surface-variant">
          <CalendarDays className="size-3.5" /> Check-in
        </span>
        <input
          type="date"
          value={checkIn}
          min={today}
          onChange={e => handleCheckIn(e.target.value)}
          className="h-11 rounded-xl border border-outline-variant/40 bg-surface px-3 text-sm text-on-surface outline-none focus:border-primary"
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="flex items-center gap-1.5 text-xs font-semibold text-on-surface-variant">
          <CalendarDays className="size-3.5" /> Check-out
        </span>
        <input
          type="date"
          value={checkOut}
          min={checkIn || today}
          onChange={e => onChange({ checkIn, checkOut: e.target.value })}
          className="h-11 rounded-xl border border-outline-variant/40 bg-surface px-3 text-sm text-on-surface outline-none focus:border-primary"
        />
      </label>
    </div>
  );
}
