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

/**
 * ⚠️ MỘT nguồn duy nhất — re-export từ `payment.types`.
 *
 * Trước đây file này khai bản riêng thiếu `'wallet'`, trong khi enum BE có và một booking trả
 * kết hợp sinh **hai** dòng payment (`wallet` + cổng). Hệ quả: mọi `Record<PaymentMethod, …>`
 * dựng từ đây (nhãn phương thức ở bảng booking của partner, bộ lọc `/admin/payments`) đều
 * thiếu khoá `wallet` — tra vào là `undefined`, đúng kiểu lỗi đã làm vỡ trang ví partner
 * hồi thiếu `settlement`.
 */
import type { PaymentMethod } from '@/types/payment.types';

export type { PaymentMethod };

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

/**
 * Bộ lọc danh sách booking của một khách sạn (`GET /hotels/:hotelId/bookings`).
 *
 * Ba điểm dựng riêng cho MÀN LỊCH, khác các màn giám sát khác:
 * - `status` nhận **cả mảng** — lịch cần `confirmed + checked_in + pending` trong một lượt.
 * - `fromDate`/`toDate` lọc theo **KHOẢNG LƯU TRÚ** (`checkInDate <= toDate AND checkOutDate >
 *   fromDate`), không phải theo ngày nhận phòng. Trước đây lọc theo ngày nhận phòng nên đơn nhận
 *   30/07 trả 09/08 **không** hiện khi xem từ 06/08 dù vẫn chiếm phòng — FE phải lùi mốc 30 ngày.
 * - `limit` tới **500** (các endpoint giám sát khác vẫn trần 100).
 */
export interface HotelBookingsParams {
  status?: BookingStatus | BookingStatus[];
  fromDate?: string;
  toDate?: string;
  sortBy?: string;
  /** Trần 500 cho endpoint này. */
  limit?: number;
  page?: number;
}

// ----- Payloads for front desk actions -----

export interface CheckInPayload {
  roomId?: string;
  voucherCode?: string;
}

/**
 * Chốt TRƯỚC một phòng vật lý cho đơn đã xác nhận nhưng chưa tới
 * (`POST /hotels/:hotelId/bookings/:bookingId/assign-room`).
 *
 * Chỉ nhận đơn `confirmed`; BE kiểm phòng đúng loại, còn dùng được, không dính đợt chặn `ooo` và
 * chưa bị đơn khác giữ trong cùng kỳ ở. Gán lại phòng khác thì gọi lại chính endpoint này — BE thay
 * bản ghi cũ, không cần gỡ trước.
 */
export interface AssignRoomPayload {
  roomId: string;
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

/**
 * Payload chặn phòng theo KHOẢNG NGÀY (`POST /hotels/:hotelId/rooms/:roomId/blocks`).
 *
 * Đây là cơ chế DUY NHẤT của BE cho "đổi tình trạng phòng theo ngày" — cột `rooms.status` là trạng
 * thái tức thời của hôm nay, không có chiều thời gian.
 */
export interface CreateRoomBlockPayload {
  blockType: RoomBlockType;
  /** `YYYY-MM-DD`. */
  startDate: string;
  /** `YYYY-MM-DD` — ngày cuối **CÒN BỊ CHẶN** (tính cả ngày này). */
  endDate: string;
  /** BE bắt buộc, tối đa 500 ký tự: chặn phòng là rút một phòng khỏi kho bán. */
  reason: string;
  estimatedCost?: number;
}

/** Đơn đã được gán ĐÚNG phòng sắp bị chặn ⇒ chắc chắn phải xếp lại phòng khác. */
export interface AffectedBooking {
  id: string;
  bookingCode: string;
  checkInDate: string;
  checkOutDate: string;
  status: BookingStatus;
  guestName: string;
}

/** Đêm mà sau khi chặn sẽ KHÔNG đủ phòng cho số đơn đã nhận (`booked > sellable`). */
export interface ShortageNight {
  date: string;
  sellable: number;
  booked: number;
  shortage: number;
}

/** Kết quả `?dryRun=true` — xem trước hậu quả, BE không ghi gì. */
export interface RoomBlockPreview {
  roomNumber: string;
  roomTypeName: string;
  affectedBookings: AffectedBooking[];
  shortageNights: ShortageNight[];
}

/** Response khi chặn thật — kèm luôn preview để staff thấy đúng thứ mình vừa gây ra. */
export interface CreateRoomBlockResult extends RoomBlockPreview {
  block: RoomBlock;
}

/**
 * Sửa một đợt chặn ĐANG MỞ (`PATCH /hotels/:hotelId/rooms/:roomId/blocks/:blockId`).
 *
 * Cố ý không có `startDate`/`blockType` — BE từ chối cả hai: ngày bắt đầu đã trôi qua thì không viết
 * lại được, còn đổi loại chặn là đổi luôn ý nghĩa tồn kho (ca đó phải gỡ đợt cũ rồi tạo đợt mới).
 * Gia hạn (`endDate` xa hơn) sẽ bị kiểm xung đột với đợt `ooo` khác; rút ngắn thì trả tồn kho về
 * cho những ngày bị cắt, **nhưng chỉ từ hôm nay trở đi**.
 */
export interface UpdateRoomBlockPayload {
  /** `YYYY-MM-DD` — ngày cuối CÒN BỊ CHẶN sau khi sửa. */
  endDate?: string;
  reason?: string;
  estimatedCost?: number;
}

/** Response của PATCH — cùng hình dạng với lúc tạo, tính trên khoảng ngày MỚI. */
export type UpdateRoomBlockResult = CreateRoomBlockResult;

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
// Inventory calendar (GET /hotels/:hotelId/inventory/calendar)
// ============================================================

/**
 * Con số này đến từ đâu:
 * - `availability` — dòng đã CHỐT trong `room_availability` (nguồn khách nhìn thấy lúc đặt phòng).
 * - `derived` — chưa có dòng nào cho đêm đó nên BE suy từ bảng `rooms` trừ đi đợt chặn `ooo`.
 *
 * Hai nguồn lệch nhau khi đối tác chỉnh tay `totalRooms`, nên UI nói ra thay vì trộn làm một.
 */
export type InventorySource = 'availability' | 'derived';

/** Một dòng của endpoint: một loại phòng × một đêm. */
export interface InventoryCalendarEntry {
  roomTypeId: string;
  roomTypeName: string;
  /** ISO datetime của cột `@db.Date` — lấy khoá ngày bằng cách cắt 10 ký tự đầu. */
  date: string;
  totalRooms: number;
  bookedRooms: number;
  /** `max(0, totalRooms - bookedRooms)` — BE đã kẹp về 0, không bao giờ âm. */
  availableRooms: number;
  source: InventorySource;
}

export interface InventoryCalendarResponse {
  from: string;
  to: string;
  results: InventoryCalendarEntry[];
}

// ----- Hình dạng dùng cho lưới trên màn hình (gom theo loại phòng) -----

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
  source: InventorySource;
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

/**
 * Tình trạng của MỘT phòng trong MỘT ngày cụ thể.
 *
 * Dùng đúng 4 nhãn của room map (`RoomStatus`) để lễ tân không phải học từ mới, cộng thêm
 * `out_of_service`: BE gộp cả `ooo` lẫn `oos` vào một nhãn `maintenance`, nhưng chỉ `ooo` mới rút
 * phòng khỏi kho bán — gộp tiếp ở đây thì nhìn lịch sẽ tưởng đếm sai số phòng.
 *
 * ⚠️ `cleaning` CHỈ có nghĩa với hôm nay: trạng thái buồng phòng là tình trạng của lúc này, phòng
 * đang dọn sáng nay không nói gì về tuần sau (xem `includeHousekeeping` của `buildRoomDayView`).
 */
export type RoomDayState =
  | 'available'
  | 'held'
  | 'occupied'
  | 'cleaning'
  | 'maintenance'
  | 'out_of_service';

/**
 * Vì sao một phòng đang ở trạng thái `held`:
 * - `assigned` — lễ tân đã **chốt thật** phòng này cho đơn (`POST .../assign-room`). Số phòng nói
 *   được với khách, và check-in sẽ dùng đúng phòng đó.
 * - `provisional` — **phỏng đoán của FE**: đơn chưa được gán phòng nào, FE xếp tạm vào một phòng
 *   trống cùng loại để nó không nằm lẫn trong nhóm "còn trống phát được". Phòng thật có thể khác.
 */
export type RoomHoldKind = 'assigned' | 'provisional';

export interface RoomDayEntry {
  room: StaffRoom;
  /** Ngày đang xét (`YYYY-MM-DD`). */
  date: string;
  state: RoomDayState;
  /** Đợt chặn phủ đúng ngày này — `null` nếu không có. */
  block: RoomBlockListItem | null;
  /** Đơn **đã check-in** đang ở phòng này trong đêm này — `null` nếu không có. */
  booking: HotelBooking | null;
  /** Đơn đang giữ phòng này nhưng chưa check-in — xem `holdKind` để biết thật hay dự kiến. */
  heldBy: HotelBooking | null;
  /** `null` khi `heldBy` là `null`. */
  holdKind: RoomHoldKind | null;
}

export interface InventoryCalendar {
  /** Ngày đầu (YYYY-MM-DD). */
  from: string;
  /** Ngày cuối, ĐÃ BAO GỒM (YYYY-MM-DD). */
  to: string;
  rows: InventoryTypeRow[];
  /** Có ít nhất một ô suy ra từ bảng `rooms` thay vì đọc `room_availability` — xem `InventorySource`. */
  hasDerivedCells: boolean;
}
