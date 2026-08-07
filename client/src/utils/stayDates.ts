import { nightsBetween, toDateInputValue } from '@/utils/formatDate';

/**
 * Ràng buộc cặp ngày nhận/trả của một kỳ ở. Tách ra dùng chung cho mọi bộ chọn ngày
 * (hero search bar, `DateRangePicker` ở trang tìm kiếm/chi tiết) — cặp ngày lệch nhau là
 * BE trả 400 hoặc tính sai số đêm, nên luật này KHÔNG được có hai bản dễ trôi lệch.
 */

/** Số đêm tối đa cho MỘT booking — khớp `MAX_NIGHTS` hard-code trong
 *  `server/src/services/booking.service.ts` (`createBooking`). BE chỉ chặn sau khi khách bấm
 *  Xác nhận (400 "Chỉ đặt được tối đa 30 đêm"); chặn ngay trên lịch ở đây để khách không chọn
 *  được một khoảng ngày vô lý ngay từ đầu. */
export const MAX_BOOKING_NIGHTS = 30;

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

/** Ngày trả phòng XA NHẤT được phép chọn (`checkIn + MAX_BOOKING_NIGHTS` đêm) — `undefined` khi
 *  chưa có ngày nhận (chưa có gì để tính cận trên). */
export function maxCheckOut(checkIn: string): string | undefined {
  if (!checkIn) return undefined;
  const d = new Date(`${checkIn}T00:00:00`);
  if (Number.isNaN(d.getTime())) return undefined;
  d.setDate(d.getDate() + MAX_BOOKING_NIGHTS);
  return toDateInputValue(d);
}

/**
 * Áp ngày nhận mới và trả về cặp ngày hợp lệ: giữ ngày trả cũ nếu vẫn sau ngày nhận và
 * trong hạn `MAX_BOOKING_NIGHTS`; lệch ngày thì đẩy lên hôm sau; quá hạn thì kẹp về đúng
 * `checkIn + MAX_BOOKING_NIGHTS` thay vì reset sạch (giữ đúng ý định "ở dài ngày" của khách,
 * chỉ so cho vừa luật). Chốt ngay tại chỗ chọn thay vì để khách bấm Tìm rồi mới báo lỗi.
 */
export function applyCheckIn(
  checkIn: string,
  checkOut: string
): { checkIn: string; checkOut: string } {
  if (!checkIn) return { checkIn: '', checkOut };
  const isAfterCheckIn = checkOut !== '' && new Date(checkOut) > new Date(checkIn);
  if (!isAfterCheckIn) return { checkIn, checkOut: nextDay(checkIn) };

  const cap = maxCheckOut(checkIn);
  const withinMax = !cap || new Date(checkOut) <= new Date(cap);
  return { checkIn, checkOut: withinMax ? checkOut : cap! };
}

/**
 * Cặp ngày có hợp lệ theo luật "trả sau nhận, tối đa `MAX_BOOKING_NIGHTS` đêm" không.
 *
 * Bộ chọn ngày (Calendar `min`/`max`) chỉ chặn được thao tác CHỌN — `checkIn`/`checkOut` đọc
 * thẳng từ URL (`HotelDetailPage`, `SearchResultsPage`) hay từ router state (checkout) hoàn
 * toàn có thể mang một khoảng vô lý mà không đi qua lịch một lần nào (link tự chế, link cũ còn
 * lưu, sửa tay query string…) — nơi nào ĐỌC ra khoảng ngày để tính giá/tạo booking phải tự
 * kiểm bằng hàm này, không được tin ngầm rằng nó đã đi qua picker.
 */
export function isValidStayRange(checkIn: string, checkOut: string): boolean {
  if (!checkIn || !checkOut) return false;
  const nights = nightsBetween(checkIn, checkOut);
  return nights > 0 && nights <= MAX_BOOKING_NIGHTS;
}
