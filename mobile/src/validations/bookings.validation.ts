import { MAX_BOOKING_NIGHTS } from '@/utils/stayDates';

/**
 * Chữ ký tối giản của `t()` — đủ cho hàm thuần ngoài React tree này dùng.
 * `key: any`: xem giải thích trong `validations/auth.validation.ts` — `TFunction<...>`
 * của i18next-react không tương thích với một type tham số `string` chung.
 */
type Translate = (key: any, options?: any) => string;

/** Validate dữ liệu booking có thể đến từ deep link/router trước khi gửi POST /bookings. */
export function bookingInputError(
  input: {
    hotelId: string;
    roomTypeId: string;
    checkIn: string;
    checkOut: string;
    guests: number;
  },
  t: Translate
): string | null {
  if (!input.hotelId || !input.roomTypeId) return t('booking:validation.missingHotelOrRoom');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.checkIn) || !/^\d{4}-\d{2}-\d{2}$/.test(input.checkOut)) {
    return t('booking:validation.invalidDates');
  }
  const checkIn = new Date(`${input.checkIn}T00:00:00`);
  const checkOut = new Date(`${input.checkOut}T00:00:00`);
  if (Number.isNaN(checkIn.getTime()) || Number.isNaN(checkOut.getTime()) || checkOut <= checkIn) {
    return t('booking:validation.checkOutBeforeCheckIn');
  }
  // Khớp business rule của BE (`MAX_NIGHTS = 30` trong `booking.service.ts`) — chặn sớm ở đây
  // thay vì để khách điền hết form khách rồi mới nhận 400 lúc bấm Xác nhận.
  const nights = Math.round((checkOut.getTime() - checkIn.getTime()) / 86_400_000);
  if (nights > MAX_BOOKING_NIGHTS) {
    return t('booking:validation.maxNights', { count: MAX_BOOKING_NIGHTS });
  }
  if (!Number.isInteger(input.guests) || input.guests < 1 || input.guests > 20) {
    return t('booking:validation.guestsRange');
  }
  return null;
}
