/** Validate dữ liệu booking có thể đến từ deep link/router trước khi gửi POST /bookings. */
export function bookingInputError(input: {
  hotelId: string;
  roomTypeId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
}): string | null {
  if (!input.hotelId || !input.roomTypeId) return 'Thiếu thông tin khách sạn hoặc loại phòng.';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.checkIn) || !/^\d{4}-\d{2}-\d{2}$/.test(input.checkOut)) {
    return 'Ngày nhận và trả phòng chưa hợp lệ.';
  }
  const checkIn = new Date(`${input.checkIn}T00:00:00`);
  const checkOut = new Date(`${input.checkOut}T00:00:00`);
  if (Number.isNaN(checkIn.getTime()) || Number.isNaN(checkOut.getTime()) || checkOut <= checkIn) {
    return 'Ngày trả phòng phải sau ngày nhận phòng ít nhất một đêm.';
  }
  if (!Number.isInteger(input.guests) || input.guests < 1 || input.guests > 20) {
    return 'Số khách phải từ 1 đến 20.';
  }
  return null;
}
