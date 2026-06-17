import { cn } from '@/lib/cn';
import type {
  BookingStatus,
  HousekeepingTaskStatus,
  PaymentStatus,
  RoomStatus,
} from '@/types/staff.types';

const BOOKING_META: Record<BookingStatus, { label: string; className: string }> = {
  pending: { label: 'Chờ thanh toán', className: 'bg-amber-100 text-amber-700' },
  confirmed: { label: 'Đã xác nhận', className: 'bg-blue-100 text-blue-700' },
  checked_in: { label: 'Đã nhận phòng', className: 'bg-emerald-100 text-emerald-700' },
  checked_out: { label: 'Đã trả phòng', className: 'bg-slate-200 text-slate-700' },
  cancelled: { label: 'Đã huỷ', className: 'bg-rose-100 text-rose-700' },
  no_show: { label: 'Không đến', className: 'bg-rose-100 text-rose-700' },
};

const ROOM_META: Record<RoomStatus, { label: string; className: string }> = {
  available: { label: 'Trống', className: 'bg-emerald-100 text-emerald-700' },
  occupied: { label: 'Đang ở', className: 'bg-blue-100 text-blue-700' },
  cleaning: { label: 'Đang dọn', className: 'bg-amber-100 text-amber-700' },
  maintenance: { label: 'Bảo trì', className: 'bg-slate-200 text-slate-700' },
};

const TASK_META: Record<HousekeepingTaskStatus, { label: string; className: string }> = {
  pending: { label: 'Chờ dọn', className: 'bg-amber-100 text-amber-700' },
  in_progress: { label: 'Đang dọn', className: 'bg-blue-100 text-blue-700' },
  done: { label: 'Đã dọn', className: 'bg-emerald-100 text-emerald-700' },
};

const PAYMENT_META: Record<PaymentStatus, { label: string; className: string }> = {
  pending: { label: 'Chờ thu', className: 'bg-amber-100 text-amber-700' },
  completed: { label: 'Đã thu', className: 'bg-emerald-100 text-emerald-700' },
  failed: { label: 'Thất bại', className: 'bg-rose-100 text-rose-700' },
  refunded: { label: 'Đã hoàn', className: 'bg-slate-200 text-slate-700' },
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
