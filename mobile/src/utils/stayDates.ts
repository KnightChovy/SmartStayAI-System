import { nightsBetween } from '@/utils/formatDate';

/** Số đêm tối đa cho MỘT booking — khớp `MAX_NIGHTS` hard-code trong
 *  `server/src/services/booking.service.ts` (`createBooking`). BE chỉ chặn sau khi khách bấm
 *  Xác nhận (400 "Chỉ đặt được tối đa 30 đêm"); chặn sớm hơn ở lịch chọn ngày + màn checkout để
 *  khách không chọn được một khoảng ngày vô lý ngay từ đầu. */
export const MAX_BOOKING_NIGHTS = 30;

/** Cặp ngày có hợp lệ theo luật "trả sau nhận, tối đa `MAX_BOOKING_NIGHTS` đêm" không.
 *
 * `StayPickerSheet` đã chặn được thao tác CHỌN qua lịch, nhưng `checkIn`/`checkOut` tới màn
 * checkout qua router param/deep link hoàn toàn có thể mang một khoảng vô lý mà không đi qua
 * lịch một lần nào — nơi nào ĐỌC ra khoảng ngày để tạo booking phải tự kiểm bằng hàm này. */
export function isValidStayRange(checkIn?: string | null, checkOut?: string | null): boolean {
  if (!checkIn || !checkOut) return false;
  const nights = nightsBetween(checkIn, checkOut);
  return nights > 0 && nights <= MAX_BOOKING_NIGHTS;
}
