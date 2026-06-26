export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'checked_in'
  | 'checked_out'
  | 'cancelled'
  | 'no_show';
export interface Booking {
  id: string;
  bookingCode: string;
  checkInDate: string;
  checkOutDate: string;
  totalAmount: string;
  status: BookingStatus;
  hotel?: { name: string; city: string };
  roomType?: { name: string };
}
