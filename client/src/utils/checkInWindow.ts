import type { BookingStatus } from '@/types/booking.types';
import { formatDate, toUtcDateKey, todayUtcKey } from './formatDate';

/**
 * Vì sao check-in bị chặn. Bản sao các guard của BE `checkInBooking`
 * (`server/src/services/booking.service.ts`) — mục đích là nói cho lễ tân biết TRƯỚC khi họ bấm,
 * thay vì để BE trả 400 ngay trước mặt khách.
 *
 * `before_time` là luật riêng của FE: BE chỉ so theo NGÀY, còn quầy còn phải chờ tới giờ nhận
 * phòng của khách sạn.
 */
export type CheckInBlockReason =
  | 'not_confirmed'
  | 'before_date'
  | 'before_time'
  | 'stay_ended';

/** Phần thông tin tối thiểu cần để xét — khớp cả `HotelBooking` lẫn `HotelBookingDetail`. */
export interface CheckInSubject {
  status: BookingStatus;
  checkInDate: string;
  checkOutDate: string;
}

/** Mốc giờ thật của một ngày booking (lưu dạng UTC) theo giờ vận hành HH:mm của khách sạn. */
export function bookingMoment(date: string, time: string): Date {
  return new Date(`${toUtcDateKey(date)}T${time}:00`);
}

/**
 * Trả lý do chặn, `null` nghĩa là check-in được ngay.
 * Thứ tự xét quan trọng: trạng thái booking xét trước để câu thông báo nói đúng chuyện đang xảy ra
 * ("đã check-in rồi", "đơn đã huỷ") thay vì rơi vào lý do ngày tháng chung chung.
 */
export function getCheckInBlockReason(
  booking: CheckInSubject,
  checkInTime: string
): CheckInBlockReason | null {
  if (booking.status !== 'confirmed') return 'not_confirmed';

  const today = todayUtcKey();
  // BE: `toUtcDate(checkOutDate) <= today` → 'Đã quá kỳ lưu trú'. Ca này trước đây FE bỏ sót.
  if (today >= toUtcDateKey(booking.checkOutDate)) return 'stay_ended';
  if (today < toUtcDateKey(booking.checkInDate)) return 'before_date';
  if (new Date() < bookingMoment(booking.checkInDate, checkInTime)) return 'before_time';

  return null;
}

export function canCheckIn(booking: CheckInSubject, checkInTime: string): boolean {
  return getCheckInBlockReason(booking, checkInTime) === null;
}

/** Câu giải thích cho lễ tân (staff portal dùng tiếng Anh), kèm việc nên làm thay thế. */
export function checkInBlockMessage(
  reason: CheckInBlockReason,
  booking: CheckInSubject,
  checkInTime: string
): string {
  switch (reason) {
    case 'stay_ended':
      return `The stay ended on ${formatDate(booking.checkOutDate)} — check-in is no longer possible. Mark this booking as a no-show instead.`;
    case 'before_date':
      return `Check-in opens at ${checkInTime} on ${formatDate(booking.checkInDate)}.`;
    case 'before_time':
      return `Check-in opens at ${checkInTime} today.`;
    case 'not_confirmed':
      return NOT_CONFIRMED_MESSAGE[booking.status];
  }
}

const NOT_CONFIRMED_MESSAGE: Record<BookingStatus, string> = {
  pending: 'This booking is still awaiting payment. Collect payment before checking the guest in.',
  confirmed: 'This booking cannot be checked in right now.',
  checked_in: 'This guest is already checked in.',
  checked_out: 'This guest has already checked out.',
  cancelled: 'This booking was cancelled.',
  no_show: 'This booking is already marked as a no-show.',
};
