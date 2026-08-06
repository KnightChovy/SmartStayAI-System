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

/**
 * Nhãn hiển thị của phòng — **giá trị SUY RA** ở BE từ 3 chiều bên dưới (`deriveRoomStatus`).
 * Vẫn được trả về nguyên vẹn nên room map cũ không phải viết lại.
 */
export type RoomStatus = 'available' | 'occupied' | 'maintenance' | 'cleaning';

/** Chiều LỄ TÂN: phòng có khách hay không. Chỉ sinh ra từ check-in/check-out, staff KHÔNG bấm tay. */
export type FoStatus = 'vacant' | 'occupied';

/** Chiều BUỒNG PHÒNG: chiều duy nhất staff đổi trực tiếp (`PATCH .../housekeeping`). */
export type HkStatus = 'dirty' | 'cleaning' | 'clean' | 'inspected';

/**
 * `ooo` = hỏng thật, **TRỪ khỏi tồn kho bán**.
 * `oos` = tạm ngưng trong ngày (kê lại đồ, giữ phòng VIP), **KHÔNG** trừ tồn kho.
 */
export type RoomBlockType = 'ooo' | 'oos';

/** Mức trễ so với định mức dọn phòng — BE tính sẵn để FE khỏi tự suy luật. */
export type CleaningSla = 'on_time' | 'warning' | 'overdue';

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
  /** Hotel operating hours returned by the existing staff-hotel endpoint. */
  checkInTime?: string | null;
  checkOutTime?: string | null;
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

/** Đợt chặn phòng theo KHOẢNG NGÀY (bảng `room_blocks`). */
export interface RoomBlock {
  id: string;
  roomId: string;
  hotelId: string;
  blockType: RoomBlockType;
  /** `YYYY-MM-DD` (cột `@db.Date`). */
  startDate: string;
  /** Ngày cuối **CÒN BỊ CHẶN** — khác `checkOutDate` của booking (ngày đó vẫn bị chặn). */
  endDate: string;
  reason: string;
  estimatedCost: string | null;
  createdBy: string;
  /** Đã sửa xong ⇒ phòng bán lại được. Dòng không bị xoá, giữ để thống kê chi phí sự cố. */
  resolvedAt: string | null;
  resolvedBy: string | null;
  createdAt: string;
}

/** Dòng của `GET /hotels/:hotelId/room-blocks` — kèm thông tin phòng để hiển thị. */
export interface RoomBlockListItem extends RoomBlock {
  room: { id: string; roomNumber: string; floor: number | null };
}

export interface StaffRoom {
  id: string;
  hotelId: string;
  roomTypeId: string;
  roomNumber: string;
  /** Nullable in the DB (`Room.floor Int?`) — a room may have no floor recorded. */
  floor: number | null;
  /** Nhãn hiển thị BE suy ra từ 3 chiều bên dưới. */
  status: RoomStatus;
  /** Chiều lễ tân — chỉ đọc, đổi qua check-in/check-out. */
  foStatus: FoStatus;
  hkStatus: HkStatus;
  /** Mốc bắt đầu trạng thái dọn hiện tại — gốc để đo SLA. */
  hkStatusSince: string | null;
  /** Hạn dọn xong do SERVER tính, không nhận từ client. */
  hkExpectedUntil: string | null;
  /** `false` = ngừng dùng phòng (thay cho xoá) ⇒ **không tính vào tồn kho**. */
  isActive: boolean;
  notes: string | null;
  /** Đợt chặn còn hiệu lực **HÔM NAY** (BE chỉ tra theo ngày hôm nay, không phải tương lai). */
  activeBlock: RoomBlock | null;
  /** `null` khi phòng không ở trạng thái dọn dở hoặc thiếu mốc thời gian. */
  cleaningSla: CleaningSla | null;
  roomType: { id: string; name: string };
}

export type StaffRoomsResponse = Paginated<StaffRoom>;

export interface StaffRoomsParams {
  status?: RoomStatus;
  roomTypeId?: string;
  isActive?: boolean;
  sortBy?: string;
  /** Trần của BE là 200; mặc định BE chỉ trả 50 nên phải tự truyền. */
  limit?: number;
  page?: number;
}

// ============================================================
// Inventory calendar (suy ở client từ rooms + bookings)
// ============================================================

/** Tồn kho của MỘT loại phòng trong MỘT đêm. */
export interface InventoryDayCell {
  /** Khoá ngày UTC `YYYY-MM-DD` — cùng cách BE truncate ngày. */
  date: string;
  /** Số phòng vật lý bán được (đã loại phòng bảo trì). */
  sellable: number;
  /** Số phòng đang bị đơn đặt chiếm trong đêm này. */
  booked: number;
  /** `sellable - booked`. Âm = overbooking. */
  available: number;
}

export interface InventoryTypeRow {
  roomTypeId: string;
  roomTypeName: string;
  /**
   * Giá gốc mỗi đêm (`RoomType.basePrice`) — dùng để xếp hàng theo phân khúc giá.
   * `null` khi loại phòng không còn bán (endpoint công khai không trả loại đã tắt).
   */
  basePrice: number | null;
  /** Đúng thứ tự ngày từ `from` tới `to`. */
  days: InventoryDayCell[];
}

export interface InventoryCalendar {
  /** Ngày đầu (YYYY-MM-DD). */
  from: string;
  /** Ngày cuối, ĐÃ BAO GỒM (YYYY-MM-DD). */
  to: string;
  rows: InventoryTypeRow[];
  /**
   * Danh sách booking bị cắt vì chạm trần phân trang (xem `use-inventory-calendar`).
   * `true` ⇒ số liệu có thể thiếu, UI phải nói ra thay vì im lặng.
   */
  truncated: boolean;
}
