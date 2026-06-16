import { cn } from '@/lib/cn';
import type { BookingStatus } from '@/types/booking.types';

/** Nhãn + màu cho từng trạng thái booking (khớp enum BookingStatus của DB). */
const STATUS_CONFIG: Record<BookingStatus, { label: string; className: string }> = {
  pending: { label: 'Pending', className: 'bg-premium-gold/15 text-premium-gold' },
  confirmed: { label: 'Confirmed', className: 'bg-primary/15 text-primary' },
  checked_in: { label: 'Checked in', className: 'bg-emerald-500/15 text-emerald-600' },
  checked_out: { label: 'Checked out', className: 'bg-outline-variant/30 text-on-surface-variant' },
  cancelled: { label: 'Cancelled', className: 'bg-error/15 text-error' },
  no_show: { label: 'No show', className: 'bg-error/10 text-error/80' },
};

export default function BookingStatusBadge({
  status,
  className,
}: {
  status: BookingStatus;
  className?: string;
}) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold',
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}
