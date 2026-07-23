import { toDateInputValue } from '@/utils/formatDate';

/**
 * Ràng buộc cặp ngày nhận/trả của một kỳ ở. Tách ra dùng chung cho mọi bộ chọn ngày
 * (hero search bar, `DateRangePicker` ở trang tìm kiếm/chi tiết) — cặp ngày lệch nhau là
 * BE trả 400 hoặc tính sai số đêm, nên luật này KHÔNG được có hai bản dễ trôi lệch.
 */

/** Parse `YYYY-MM-DD` (nửa đêm giờ địa phương); `undefined` nếu rỗng/không hợp lệ. */
export function parseDateValue(value?: string | null): Date | undefined {
  if (!value) return undefined;
  const d = new Date(`${value}T00:00:00`);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

/** Ngày kế tiếp của `YYYY-MM-DD`, cũng ở dạng `YYYY-MM-DD`. */
export function nextDay(value: string): string {
  const d = new Date(`${value}T00:00:00`);
  d.setDate(d.getDate() + 1);
  return toDateInputValue(d);
}

/** Ngày trả phòng sớm nhất: hôm sau ngày nhận, hoặc `today` khi chưa chọn ngày nhận. */
export function minCheckOut(checkIn: string, today: string): string {
  return checkIn ? nextDay(checkIn) : today;
}

/**
 * Áp ngày nhận mới và trả về cặp ngày hợp lệ: giữ ngày trả cũ nếu vẫn sau ngày nhận,
 * ngược lại đẩy lên hôm sau. Chốt ngay tại chỗ chọn thay vì để khách bấm Tìm rồi mới báo lỗi.
 */
export function applyCheckIn(
  checkIn: string,
  checkOut: string
): { checkIn: string; checkOut: string } {
  if (!checkIn) return { checkIn: '', checkOut };
  const stillValid = checkOut !== '' && new Date(checkOut) > new Date(checkIn);
  return { checkIn, checkOut: stillValid ? checkOut : nextDay(checkIn) };
}
