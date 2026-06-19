import type { Paginated } from '@/types/api.types';

// ============================================================
// Enum khớp backend (server/prisma/schema.prisma)
// ============================================================

export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'checked_in'
  | 'checked_out'
  | 'cancelled'
  | 'no_show';

export type RoomStatus = 'available' | 'occupied' | 'maintenance' | 'cleaning';

export type HousekeepingTaskStatus = 'pending' | 'in_progress' | 'done';

export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export type StaffPaymentMethod = 'vnpay' | 'cash';

// ============================================================
// Khách sạn staff đang trực (lấy từ GET /hotels — public list)
// ============================================================

/** Khách sạn rút gọn dùng cho bộ chọn "nơi làm việc" của staff. */
export interface StaffHotel {
  id: string;
  name: string;
  city: string;
  address?: string;
}

// ============================================================
// Booking phía vận hành khách sạn (GET /hotels/:hotelId/bookings)
// Decimal serialize thành string qua JSON.
// ============================================================

export interface BookingCustomerSummary {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
}

export interface BookingRoomTypeSummary {
  id: string;
  name: string;
  bedType?: string | null;
  viewType?: string | null;
}

export interface AssignedRoomSummary {
  id: string;
  roomNumber: string;
  floor: number;
}

export interface BookingRoomLink {
  id: string;
  roomId: string;
  assignedAt: string;
  room?: AssignedRoomSummary;
}

/** Một dòng booking trong danh sách quầy lễ tân. */
export interface HotelBooking {
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
  source: string;
  specialRequests: string | null;
  holdExpiresAt: string | null;
  cancellationReason: string | null;
  checkedInAt: string | null;
  checkedOutAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
  customer: BookingCustomerSummary;
  roomType: BookingRoomTypeSummary;
  bookingRooms: BookingRoomLink[];
}

export interface BookingVoucherSummary {
  voucherCode: string;
  qrData: string;
  usedAt: string | null;
  expiresAt: string | null;
}

export interface BookingPaymentSummary {
  id: string;
  paymentMethod: StaffPaymentMethod;
  amount: string;
  status: PaymentStatus;
  paidAt: string | null;
}

export interface BookingInvoiceSummary {
  id: string;
  invoiceNumber?: string;
  totalAmount?: string;
}

/** Chi tiết booking cho quầy lễ tân (GET /hotels/:hotelId/bookings/:bookingId). */
export interface HotelBookingDetail extends HotelBooking {
  voucher: BookingVoucherSummary | null;
  payments: BookingPaymentSummary[];
  invoice: BookingInvoiceSummary | null;
}

export type HotelBookingsResponse = Paginated<HotelBooking>;

/** Bộ lọc danh sách booking khách sạn. */
export interface HotelBookingsParams {
  status?: BookingStatus;
  fromDate?: string;
  toDate?: string;
  sortBy?: string;
  limit?: number;
  page?: number;
}

// ----- Payload các hành động lễ tân -----

export interface CheckInPayload {
  roomId?: string;
  voucherCode?: string;
}

export interface CheckOutPayload {
  extraCharge?: number;
}

// ============================================================
// Housekeeping (GET /hotels/:hotelId/housekeeping)
// ============================================================

export interface HousekeepingRoomSummary {
  id: string;
  roomNumber: string;
  floor: number;
  status: RoomStatus;
}

export interface HousekeepingTask {
  id: string;
  hotelId: string;
  roomId: string;
  status: HousekeepingTaskStatus;
  notes: string | null;
  createdAt: string;
  completedAt: string | null;
  room: HousekeepingRoomSummary;
}

// ============================================================
// Phòng vật lý (GET /hotels/:hotelId/rooms)
// ============================================================

export interface StaffRoom {
  id: string;
  hotelId: string;
  roomTypeId: string;
  roomNumber: string;
  floor: number;
  status: RoomStatus;
  notes: string | null;
  roomType: { id: string; name: string };
}

export type StaffRoomsResponse = Paginated<StaffRoom>;
