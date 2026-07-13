import type { BookingFormValues } from '@/validations/booking.validation';

export interface BookingDetailsFormProps {
  onSubmit: (values: BookingFormValues) => void;
}

export interface BookingSidebarProps {
  checkIn: string;
  checkOut: string;
  nights: number;
  guests: string;
  roomName: string;
  pricePerNight: number;
  formatDisplayDate: (dateStr: string) => string;
}

// ============================================================
// Type cho luồng đặt phòng nối API (`/bookings`)
// ============================================================

export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'checked_in'
  | 'checked_out'
  | 'cancelled'
  | 'no_show';

export type BookingSource =
  | 'website'
  | 'mobile_app'
  | 'chatbot'
  | 'walk_in'
  | 'staff';

/** Tóm tắt khách sạn/loại phòng đính kèm trong booking (backend include sẵn). */
export interface BookingHotelSummary {
  id: string;
  name: string;
  address: string;
  city: string;
  checkInTime?: string | null;
  checkOutTime?: string | null;
}

export interface BookingRoomTypeSummary {
  id: string;
  name: string;
  bedType?: string | null;
  viewType?: string | null;
  maxOccupancy: number;
}

/** E-voucher đính kèm booking (backend include sẵn) — dùng để render QR check-in. */
export interface BookingVoucherSummary {
  voucherCode: string;
  qrData: string;
  usedAt?: string | null;
}

/** Booking trả về từ backend. Decimal serialize thành string qua JSON. */
export interface Booking {
  id: string;
  bookingCode: string;
  customerId: string;
  hotelId: string;
  roomTypeId: string;
  checkInDate: string;
  checkOutDate: string;
  numNights: number;
  numGuests: number;
  basePricePerNight: string;
  subtotal: string;
  discountAmount: string;
  totalAmount: string;
  status: BookingStatus;
  source: BookingSource;
  specialRequests?: string | null;
  cancellationReason?: string | null;
  checkedInAt?: string | null;
  checkedOutAt?: string | null;
  cancelledAt?: string | null;
  createdAt: string;
  updatedAt: string;
  hotel?: BookingHotelSummary;
  roomType?: BookingRoomTypeSummary;
  voucher?: BookingVoucherSummary | null;
}

/**
 * Payload viết đánh giá sau khi trả phòng (`POST /reviews`).
 * BE chỉ cần `bookingId` (tự suy ra hotel + kiểm quyền/điều kiện), không cần hotelName/bookingCode.
 */
export interface CreateReviewPayload {
  bookingId: string;
  overallRating: number;
  cleanlinessRating: number;
  serviceRating: number;
  locationRating: number;
  valueRating: number;
  title?: string;
  content: string;
  images?: string[];
}

/** Payload tạo booking — giá do server tự tính, client KHÔNG gửi tiền. */
export interface CreateBookingPayload {
  hotelId: string;
  roomTypeId: string;
  checkInDate: string;
  checkOutDate: string;
  numGuests: number;
  specialRequests?: string;
}

export interface MyBookingsParams {
  status?: BookingStatus;
  sortBy?: string;
  page?: number;
  limit?: number;
}
