import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/cn';
import type { BookingStatus } from '@/types/booking.types';

/** Màu cho từng trạng thái booking (khớp enum BookingStatus của DB). Nhãn qua i18n. */
const STATUS_CLASS: Record<BookingStatus, string> = {
  pending: 'bg-premium-gold/15 text-premium-gold',
  confirmed: 'bg-primary/15 text-primary',
  checked_in: 'bg-emerald-500/15 text-emerald-600',
  checked_out: 'bg-outline-variant/30 text-on-surface-variant',
  cancelled: 'bg-error/15 text-error',
  no_show: 'bg-error/10 text-error/80',
};

export default function BookingStatusBadge({
  status,
  className,
}: {
  status: BookingStatus;
  className?: string;
}) {
  const { t } = useTranslation('account');
  const cls = STATUS_CLASS[status] ?? STATUS_CLASS.pending;
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold',
        cls,
        className
      )}
    >
      {t(`status.${status}`)}
    </span>
  );
}
