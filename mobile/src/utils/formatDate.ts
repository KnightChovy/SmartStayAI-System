/** Helper xử lý ngày cho luồng đặt phòng (Hermes thiếu Intl đầy đủ nên format thủ công). */

const MONTHS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];
const WEEKDAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** Ép input về Date; nhận ISO string hoặc Date. */
function toDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Khóa ngày `YYYY-MM-DD` theo lịch địa phương — gửi cho backend (checkInDate/checkOutDate). */
export function toDateKey(value: string | Date): string {
  const d = value instanceof Date ? value : new Date(value);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Ngày hôm nay dạng `YYYY-MM-DD`. */
export function todayKey(): string {
  return toDateKey(new Date());
}

/** Cộng `days` ngày vào một mốc rồi trả về Date mới (không đụng input). */
export function addDays(value: string | Date, days: number): Date {
  const d = value instanceof Date ? new Date(value) : new Date(value);
  d.setDate(d.getDate() + days);
  return d;
}

/** "Mon, 21 Aug" — hiển thị ngắn gọn cho UI. */
export function formatDateShort(value: string | Date | null | undefined): string {
  const d = toDate(value);
  if (!d) return '—';
  return `${WEEKDAYS_SHORT[d.getDay()]}, ${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;
}

/** "21 Aug 2026" — có năm, cho màn chi tiết. */
export function formatDateLong(value: string | Date | null | undefined): string {
  const d = toDate(value);
  if (!d) return '—';
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`;
}

/** Số đêm giữa hai mốc (tối thiểu 0). */
export function nightsBetween(
  checkIn: string | Date | null | undefined,
  checkOut: string | Date | null | undefined,
): number {
  const a = toDate(checkIn);
  const b = toDate(checkOut);
  if (!a || !b) return 0;
  const ms = b.getTime() - a.getTime();
  const nights = Math.round(ms / (1000 * 60 * 60 * 24));
  return nights > 0 ? nights : 0;
}
