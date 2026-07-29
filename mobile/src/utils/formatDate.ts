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

/** "dd-MM-yyyy" — khớp formatter dùng chung bên client (formatDate.ts). */
export function formatDate(value: string | Date | null | undefined): string {
  const d = toDate(value);
  if (!d) return '—';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}-${mm}-${d.getFullYear()}`;
}

/** "HH:mm" — giờ:phút, cho timestamp dưới bong bóng tin nhắn. */
export function formatTime(value: string | Date | null | undefined): string {
  const d = toDate(value);
  if (!d) return '';
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/** Thời gian tương đối gọn ("vừa xong", "5 phút", "2 giờ", "3 ngày") cho danh sách hội thoại. */
export function formatRelative(value: string | Date | null | undefined): string {
  const d = toDate(value);
  if (!d) return '';
  const diffSec = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diffSec < 60) return 'vừa xong';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} phút`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} giờ`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay} ngày`;
  return formatDate(d);
}

/** Đơn vị của thời gian tương đối — component tự dịch sang chữ. */
export type RelativeTimeUnit = 'now' | 'minutes' | 'hours' | 'yesterday' | 'days' | 'date';

/** Trả về MÔ TẢ thời gian tương đối, không phải chuỗi hiển thị: file này cố ý không chứa `t()`
 *  (mọi formatter ở đây đều i18n-free), nên phần dịch để component lo.
 *  Quá 7 ngày trả `date` → nơi gọi dùng `formatDate()`. */
export function relativeTimeParts(
  value: number | string | Date | null | undefined,
  now: number = Date.now(),
): { unit: RelativeTimeUnit; count: number } {
  const d = typeof value === 'number' ? new Date(value) : toDate(value);
  if (!d) return { unit: 'date', count: 0 };

  const diffMs = now - d.getTime();
  if (diffMs < 60_000) return { unit: 'now', count: 0 };
  if (diffMs < 3_600_000) return { unit: 'minutes', count: Math.floor(diffMs / 60_000) };

  // So theo NGÀY LỊCH chứ không theo mốc 24 giờ: 23:00 hôm qua nhìn từ 01:00 hôm nay là
  // "Hôm qua", nói "2 giờ trước" thì đúng số nhưng sai cảm nhận về ngày.
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const dayDiff = Math.floor((startOfToday.getTime() - d.getTime()) / 86_400_000) + 1;

  if (dayDiff <= 0) return { unit: 'hours', count: Math.floor(diffMs / 3_600_000) };
  if (dayDiff === 1) return { unit: 'yesterday', count: 1 };
  if (dayDiff < 7) return { unit: 'days', count: dayDiff };
  return { unit: 'date', count: dayDiff };
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
