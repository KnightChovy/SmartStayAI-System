import { CalendarDays } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { DatePicker } from '@/components/ui/date-picker';
import { cn } from '@/lib/cn';
import { toDateInputValue } from '@/utils/formatDate';
import { applyCheckIn, minCheckOut } from '@/utils/stayDates';

interface DateRangePickerProps {
  checkIn: string;
  checkOut: string;
  onChange: (range: { checkIn: string; checkOut: string }) => void;
  className?: string;
}

/**
 * Chọn ngày nhận/trả — dùng chung DatePicker (shadcn Popover + Calendar) như các portal khác,
 * thay cho `<input type="date">` gốc (mỗi trình duyệt một kiểu, trên iOS Safari là bánh xe cuộn).
 *
 * Ràng buộc ngày đẩy thẳng xuống lịch qua `min`/`max`: checkIn không được trước hôm nay,
 * checkOut luôn phải sau checkIn — ngày không hợp lệ bị disable ngay trên lịch nên khách
 * không chọn được rồi mới báo lỗi.
 */
export default function DateRangePicker({
  checkIn,
  checkOut,
  onChange,
  className,
}: DateRangePickerProps) {
  const { t } = useTranslation('common');
  const today = toDateInputValue(new Date());

  // Luật "ngày trả luôn sau ngày nhận" nằm ở `utils/stayDates` — dùng chung với thanh tìm
  // kiếm hero để hai chỗ không thể lệch nhau.
  const handleCheckIn = (value: string) => onChange(applyCheckIn(value, checkOut));

  return (
    <div className={cn('grid grid-cols-2 gap-2', className)}>
      <div className="flex flex-col gap-1">
        <span className="flex items-center gap-1.5 text-xs font-semibold text-on-surface-variant">
          <CalendarDays className="size-3.5" /> {t('checkIn')}
        </span>
        <DatePicker
          value={checkIn}
          onChange={handleCheckIn}
          min={today}
          placeholder={t('checkIn')}
          clearLabel={t('clearDate')}
          className="rounded-xl border-outline-variant/40"
        />
      </div>
      <div className="flex flex-col gap-1">
        <span className="flex items-center gap-1.5 text-xs font-semibold text-on-surface-variant">
          <CalendarDays className="size-3.5" /> {t('checkOut')}
        </span>
        <DatePicker
          value={checkOut}
          onChange={value => onChange({ checkIn, checkOut: value })}
          min={minCheckOut(checkIn, today)}
          placeholder={t('checkOut')}
          clearLabel={t('clearDate')}
          className="rounded-xl border-outline-variant/40"
        />
      </div>
    </div>
  );
}
