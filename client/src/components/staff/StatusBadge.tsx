import { cn } from '@/lib/cn';
import type {
  BookingStatus,
  HousekeepingTaskStatus,
  PaymentStatus,
  RoomStatus,
} from '@/types/staff.types';

const BOOKING_META: Record<BookingStatus, { label: string; className: string }> = {
  pending: { label: 'Awaiting payment', className: 'bg-amber-100 text-amber-700' },
  confirmed: { label: 'Confirmed', className: 'bg-blue-100 text-blue-700' },
  checked_in: { label: 'Checked in', className: 'bg-emerald-100 text-emerald-700' },
  checked_out: { label: 'Checked out', className: 'bg-slate-200 text-slate-700' },
  cancelled: { label: 'Cancelled', className: 'bg-rose-100 text-rose-700' },
  no_show: { label: 'No-show', className: 'bg-rose-100 text-rose-700' },
};

const ROOM_META: Record<RoomStatus, { label: string; className: string }> = {
  available: { label: 'Available', className: 'bg-emerald-100 text-emerald-700' },
  occupied: { label: 'Occupied', className: 'bg-blue-100 text-blue-700' },
  cleaning: { label: 'Cleaning', className: 'bg-amber-100 text-amber-700' },
  maintenance: { label: 'Maintenance', className: 'bg-slate-200 text-slate-700' },
};

const TASK_META: Record<HousekeepingTaskStatus, { label: string; className: string }> = {
  pending: { label: 'To clean', className: 'bg-amber-100 text-amber-700' },
  in_progress: { label: 'Cleaning', className: 'bg-blue-100 text-blue-700' },
  done: { label: 'Cleaned', className: 'bg-emerald-100 text-emerald-700' },
};

const PAYMENT_META: Record<PaymentStatus, { label: string; className: string }> = {
  pending: { label: 'Pending', className: 'bg-amber-100 text-amber-700' },
  completed: { label: 'Paid', className: 'bg-emerald-100 text-emerald-700' },
  failed: { label: 'Failed', className: 'bg-rose-100 text-rose-700' },
  refunded: { label: 'Refunded', className: 'bg-slate-200 text-slate-700' },
};

interface BadgeProps {
  className?: string;
}

function Pill({ label, color, className }: { label: string; color: string; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
        color,
        className
      )}
    >
      {label}
    </span>
  );
}

export function BookingStatusBadge({ status, className }: { status: BookingStatus } & BadgeProps) {
  const meta = BOOKING_META[status];
  return <Pill label={meta.label} color={meta.className} className={className} />;
}

export function RoomStatusBadge({ status, className }: { status: RoomStatus } & BadgeProps) {
  const meta = ROOM_META[status];
  return <Pill label={meta.label} color={meta.className} className={className} />;
}

export function TaskStatusBadge({
  status,
  className,
}: {
  status: HousekeepingTaskStatus;
} & BadgeProps) {
  const meta = TASK_META[status];
  return <Pill label={meta.label} color={meta.className} className={className} />;
}

export function PaymentStatusBadge({ status, className }: { status: PaymentStatus } & BadgeProps) {
  const meta = PAYMENT_META[status];
  return <Pill label={meta.label} color={meta.className} className={className} />;
}
