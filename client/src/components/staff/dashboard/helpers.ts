import type { BookingStatus, HotelBooking } from '@/types/staff.types';

export interface DayPoint {
  day: string;
  revenue: number;
  bookings: number;
}

export interface StatusSlice {
  key: BookingStatus;
  label: string;
  value: number;
  color: string;
}

export interface RoomTypeBar {
  name: string;
  bookings: number;
}

/** Trạng thái tính vào doanh thu (đã cam kết/đã ở). Cancelled/no-show/pending không tính. */
const REVENUE_STATUSES = new Set<BookingStatus>(['confirmed', 'checked_in', 'checked_out']);

/** Màu (hex) cho từng trạng thái — khớp tinh thần bảng màu Pill nhưng để recharts dùng. */
export const STATUS_META: Record<BookingStatus, { label: string; color: string }> = {
  pending: { label: 'Pending', color: '#f59e0b' },
  confirmed: { label: 'Confirmed', color: '#3b82f6' },
  checked_in: { label: 'Checked in', color: '#10b981' },
  checked_out: { label: 'Checked out', color: '#94a3b8' },
  cancelled: { label: 'Cancelled', color: '#ef4444' },
  no_show: { label: 'No-show', color: '#a855f7' },
};

const pad = (n: number) => String(n).padStart(2, '0');
const dayKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** Doanh thu + số booking theo ngày, `days` ngày gần nhất (theo `createdAt`). */
export function buildDailySeries(bookings: HotelBooking[], days = 14): DayPoint[] {
  const buckets = new Map<string, { revenue: number; bookings: number }>();
  const order: string[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = dayKey(d);
    buckets.set(key, { revenue: 0, bookings: 0 });
    order.push(key);
  }

  for (const b of bookings) {
    const d = new Date(b.createdAt);
    d.setHours(0, 0, 0, 0);
    const bucket = buckets.get(dayKey(d));
    if (!bucket) continue; // ngoài cửa sổ 14 ngày
    bucket.bookings += 1;
    if (REVENUE_STATUSES.has(b.status)) bucket.revenue += Number(b.totalAmount) || 0;
  }

  return order.map(key => {
    const [, m, d] = key.split('-');
    return { day: `${d}/${m}`, ...buckets.get(key)! };
  });
}

/** Cơ cấu trạng thái booking (chỉ giữ trạng thái có số > 0). */
export function buildStatusSlices(bookings: HotelBooking[]): StatusSlice[] {
  const count = new Map<BookingStatus, number>();
  for (const b of bookings) count.set(b.status, (count.get(b.status) ?? 0) + 1);
  return (Object.keys(STATUS_META) as BookingStatus[])
    .map(s => ({ key: s, label: STATUS_META[s].label, value: count.get(s) ?? 0, color: STATUS_META[s].color }))
    .filter(s => s.value > 0);
}

/** Số booking theo loại phòng, nhiều nhất trước. */
export function buildRoomTypeBars(bookings: HotelBooking[]): RoomTypeBar[] {
  const count = new Map<string, number>();
  for (const b of bookings) {
    const name = b.roomType?.name ?? '—';
    count.set(name, (count.get(name) ?? 0) + 1);
  }
  return [...count.entries()]
    .map(([name, bookings]) => ({ name, bookings }))
    .sort((a, b) => b.bookings - a.bookings);
}
