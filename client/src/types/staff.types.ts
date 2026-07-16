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

export type PaymentMethod = 'vnpay' | 'sepay' | 'stripe' | 'cash';

/** @deprecated dùng `PaymentMethod` — giữ alias để không vỡ code cũ. */
export type StaffPaymentMethod = PaymentMethod;

export type BookingSource = 'website' | 'mobile_app' | 'chatbot' | 'walk_in' | 'staff';

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
  floor: number | null;
}

export interface BookingRoomLink {
  id: string;
  bookingId?: string;
  roomId: string;
  assignedAt: string;
  room?: AssignedRoomSummary;
}

/** Voucher rút gọn kèm trong booking ở màn list (StaffBooking.voucher). */
export interface BookingListVoucher {
  voucherCode: string;
  usedAt: string | null;
}

/**
 * A single booking row in the hotel operations list (BE `staffBookingInclude`).
 * Tương ứng `StaffBooking` trong spec — kèm `customer`, `roomType`, `bookingRooms`, `voucher`.
 */
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
  source: BookingSource;
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
  voucher: BookingListVoucher | null;
}

export interface BookingVoucherSummary {
  voucherCode: string;
  qrData: string;
  usedAt: string | null;
  expiresAt: string | null;
}

export interface BookingPaymentSummary {
  id: string;
  paymentMethod: PaymentMethod;
  amount: string;
  status: PaymentStatus;
  paidAt: string | null;
}

/** Hoá đơn xuất khi check-out (GET detail + CheckOutResponse). */
export interface Invoice {
  id: string;
  bookingId: string;
  invoiceNumber: string;
  issuedAt: string;
  pdfUrl: string | null;
  subtotal: string;
  taxAmount: string;
  totalAmount: string;
  createdAt: string;
}

/** Booking detail for the front desk (GET /hotels/:hotelId/bookings/:bookingId). */
export interface HotelBookingDetail extends HotelBooking {
  voucher: BookingVoucherSummary | null;
  payments: BookingPaymentSummary[];
  invoice: Invoice | null;
}

/** Response của POST .../check-out — StaffBooking kèm hoá đơn vừa xuất. */
export interface CheckOutResponse extends HotelBooking {
  invoice: Invoice;
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
  /** Nullable in the DB (`Room.floor Int?`). */
  floor: number | null;
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
  /** Nullable in the DB (`Room.floor Int?`) — a room may have no floor recorded. */
  floor: number | null;
  status: RoomStatus;
  notes: string | null;
  roomType: { id: string; name: string };
}

export type StaffRoomsResponse = Paginated<StaffRoom>;
