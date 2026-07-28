import { useTranslation } from 'react-i18next';
import { CalendarCheck, Ban } from 'lucide-react';
import { cn } from '@/lib/cn';

interface CancellationLineProps {
  /** `hotel.settings.cancellation.freeUntilHours`: >0 miễn phí trước N giờ · 0 không hoàn tiền · null chưa biết. */
  freeUntilHours: number | null | undefined;
  className?: string;
}

/**
 * Dòng chính sách hủy nổi bật trong booking card (SS-302).
 * Xanh khi hủy miễn phí (`freeUntilHours > 0`), xám khi không hoàn tiền (`= 0`);
 * `null`/`undefined` (khách sạn chưa khai) → không hiển thị gì (không đoán thay khách sạn).
 */
export default function CancellationLine({ freeUntilHours, className }: CancellationLineProps) {
  const { t } = useTranslation('hotel');
  if (freeUntilHours == null) return null;

  const free = freeUntilHours > 0;
  const Icon = free ? CalendarCheck : Ban;

  return (
    <p
      className={cn(
        'flex items-center gap-1.5 text-sm font-medium',
        free ? 'text-emerald-700' : 'text-on-surface-variant',
        className
      )}
    >
      <Icon className="size-4 shrink-0" aria-hidden="true" />
      {free
        ? t('room.freeCancellation', { hours: freeUntilHours })
        : t('room.nonRefundable')}
    </p>
  );
}
