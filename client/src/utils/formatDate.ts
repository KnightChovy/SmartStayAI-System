/**
 * Ngày dạng `dd/MM/yyyy` — formatter ngày dùng chung của app.
 * Nhận ISO string / Date / null; trả "—" nếu rỗng hoặc không hợp lệ.
 */
export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return '—';
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return '—';
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

/** Ngày dạng dài "July 01, 2026" — dùng cho đồng hồ realtime ở Admin. */
export function formatDateLong(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

export function formatTime(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(date);
}

/** Format ngày từ chuỗi ISO/Date về dạng "12 Jun 2026"; trả "—" nếu rỗng/không hợp lệ. */
export function formatDateShort(value: string | Date | null | undefined): string {
  if (!value) return '—';
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

/** Số đêm giữa hai mốc ngày (chuỗi YYYY-MM-DD hoặc ISO). 0 nếu không hợp lệ. */
export function nightsBetween(checkIn?: string | null, checkOut?: string | null): number {
  if (!checkIn || !checkOut) return 0;
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;
  const ms = end.getTime() - start.getTime();
  return ms > 0 ? Math.round(ms / (1000 * 60 * 60 * 24)) : 0;
}

/** Khoá ngày UTC dạng YYYY-MM-DD từ ISO/Date — khớp cách BE truncate ngày (toUtcDate). */
export function toUtcDateKey(value: string | Date | null | undefined): string {
  if (!value) return '';
  const d = typeof value === 'string' ? new Date(value) : value;
  return Number.isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10);
}

/** Khoá ngày UTC của hôm nay (so với checkInDate/checkOutDate của booking). */
export function todayUtcKey(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Chuỗi ngày dạng YYYY-MM-DD (dùng cho input[type=date] và query API). */
export function toDateInputValue(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}