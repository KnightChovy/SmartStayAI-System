import type { Paginated } from '@/types/api.types';

// ============================================================
// Enums matching the backend (server/prisma/schema.prisma)
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
// Hotel the staff member is working at (from GET /hotels — public list)
// ============================================================

/** Condensed hotel used for the staff "workplace" picker. */
export interface StaffHotel {
  id: string;
  name: string;
  city: string;
  address?: string;
}

// ============================================================
// Bookings from the hotel operations side (GET /hotels/:hotelId/bookings)
// Decimals are serialized to strings via JSON.
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

/** A single booking row in the front desk list. */
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

/** Booking detail for the front desk (GET /hotels/:hotelId/bookings/:bookingId). */
export interface HotelBookingDetail extends HotelBooking {
  voucher: BookingVoucherSummary | null;
  payments: BookingPaymentSummary[];
  invoice: BookingInvoiceSummary | null;
}

export type HotelBookingsResponse = Paginated<HotelBooking>;

/** Filters for the hotel booking list. */
export interface HotelBookingsParams {
  status?: BookingStatus;
  fromDate?: string;
  toDate?: string;
  sortBy?: string;
  limit?: number;
  page?: number;
}

// ----- Payloads for front desk actions -----

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
// Physical rooms (GET /hotels/:hotelId/rooms)
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
