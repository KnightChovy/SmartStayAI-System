import type { BookingStatus } from '@/types/bookings.type';

/* ===================== Khách sạn staff được phân công ===================== */

/** Item của `GET /hotels/me/assignments` — KS staff đang vận hành (cover + đếm phòng). */
export interface StaffAssignedHotel {
  id: string;
  name: string;
  city: string;
  address: string;
  starRating?: number | null;
  images?: { id: string; imageUrl: string; isPrimary: boolean }[];
  _count?: { roomTypes: number; rooms: number };
}

export interface StaffBookingCustomer {
  id: string;
  fullName: string;
  email: string;
  phone?: string | null;
}

export interface StaffBookingRoomType {
  id: string;
  name: string;
}

/** Một phòng vật lý đã gán cho booking. */
export interface StaffBookingRoom {
  id: string;
  assignedAt: string;
  room: {
    id: string;
    roomNumber: string;
    floor?: number | null;
  };
}

export interface BookingVoucher {
  voucherCode: string;
  usedAt?: string | null;
}

export interface StaffBooking {
  id: string;
  bookingCode: string;
  hotelId: string;
  roomTypeId: string;
  checkInDate: string;
  checkOutDate: string;
  numNights: number;
  numGuests: number;
  totalAmount: string;
  status: BookingStatus;
  /** Hạn giữ chỗ cho đơn `pending` — quá hạn thì đơn không còn chiếm phòng nữa dù `status` chưa
   *  kịp đổi (cron dọn theo lịch, không tức thời). `null`/không có = giữ chỗ không thời hạn. */
  holdExpiresAt?: string | null;
  checkedInAt?: string | null;
  checkedOutAt?: string | null;
  createdAt: string;
  customer: StaffBookingCustomer;
  roomType: StaffBookingRoomType;
  bookingRooms: StaffBookingRoom[];
  voucher?: BookingVoucher | null;
}

export interface StaffBookingsParams {
  // BE nhận cả 1 giá trị lẫn MẢNG (`.single()`) — mảng dùng để lọc "đang chiếm phòng đêm X"
  // (confirmed + checked_in) trong một lượt cho bản đồ phòng theo ngày.
  status?: BookingStatus | BookingStatus[];
  fromDate?: string;
  toDate?: string;
  page?: number;
  limit?: number;
}

export interface CheckInPayload {
  roomId?: string;
  voucherCode?: string;
}

/** `POST .../assign-room` — chốt trước phòng vật lý cho một booking `confirmed`. */
export interface AssignRoomPayload {
  roomId: string;
}

export interface CheckOutPayload {
  extraCharge?: number;
}

export type HousekeepingStatus = 'pending' | 'in_progress' | 'done';

export interface HousekeepingTask {
  id: string;
  hotelId: string;
  roomId: string;
  bookingId?: string | null;
  status: HousekeepingStatus;
  note?: string | null;
  createdAt: string;
  completedAt?: string | null;
  room: {
    id: string;
    roomNumber: string;
    floor?: number | null;
    status: string;
  };
}

export interface HousekeepingParams {
  status?: HousekeepingStatus;
}

export type RoomStatus =
  | 'available'
  | 'occupied'
  | 'maintenance'
  | 'cleaning'
  | 'blocked';

export type RoomStatusUpdatable = Exclude<RoomStatus, 'blocked'>;

export interface StaffRoom {
  id: string;
  hotelId: string;
  roomTypeId: string;
  roomNumber: string;
  floor?: number | null;
  status: RoomStatus;
  /** Phòng đã "nghỉ bán" (rút khỏi biên chế) — vẫn tồn tại để tra cứu nhưng không phát cho khách
   *  được nữa. Không có trong response cũ (kiểm `!== false` để coi thiếu field = còn hoạt động). */
  isActive?: boolean;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  roomType: {
    id: string;
    name: string;
  };
}

export interface StaffRoomsParams {
  page?: number;
  limit?: number;
}

export type RoomBlockType = 'ooo' | 'oos';

/** Một đợt chặn phòng theo khoảng ngày (bảo trì / hỏng hóc). */
export interface RoomBlock {
  id: string;
  roomId: string;
  hotelId: string;
  blockType: RoomBlockType;
  startDate: string;
  endDate: string;
  reason: string;
  estimatedCost?: string | null;
  createdBy: string;
  resolvedAt?: string | null;
  resolvedBy?: string | null;
  createdAt: string;
  room?: {
    id: string;
    roomNumber: string;
    floor?: number | null;
  };
}

export interface CreateRoomBlockPayload {
  blockType: RoomBlockType;
  startDate: string;
  endDate: string;
  reason: string;
  estimatedCost?: number;
}

export interface UpdateRoomBlockPayload {
  endDate?: string;
  reason?: string;
  estimatedCost?: number;
}

export interface RoomBlockAffectedBooking {
  id: string;
  bookingCode: string;
  checkInDate: string;
  checkOutDate: string;
  status: string;
  guestName: string;
}

export interface RoomBlockShortageNight {
  date: string;
  sellable: number;
  booked: number;
  shortage: number;
}

/** Trả về từ create/update block — kèm preview hậu quả (booking bị ảnh hưởng + ngày thiếu phòng). */
export interface RoomBlockResult {
  block: RoomBlock;
  roomNumber: string;
  roomTypeName: string;
  affectedBookings: RoomBlockAffectedBooking[];
  shortageNights: RoomBlockShortageNight[];
}

/** Một dòng "loại phòng × một đêm" từ `GET /hotels/:hotelId/inventory/calendar`. */
export interface InventoryCalendarEntry {
  roomTypeId: string;
  roomTypeName: string;
  /** ISO datetime — cắt 10 ký tự đầu để ra khoá `YYYY-MM-DD`. */
  date: string;
  totalRooms: number;
  bookedRooms: number;
  /** BE đã kẹp về 0 — không âm được, khác con số client tự suy để biết overbooking. */
  availableRooms: number;
  /** `'availability'` = đã có dòng chốt trong `room_availability` (đúng số khách nhìn thấy lúc
   *  đặt); `'derived'` = chưa có dòng, BE tự suy từ bảng `rooms`. */
  source: 'availability' | 'derived';
}

export interface InventoryCalendarResponse {
  from: string;
  to: string;
  results: InventoryCalendarEntry[];
}

export type ConversationStatus =
  | 'open'
  | 'pending'
  | 'active'
  | 'escalated'
  | 'resolved'
  | 'closed';

export type ConversationChannel = 'web' | 'mobile' | 'email' | 'whatsapp';

export type MessageSenderType = 'guest' | 'staff' | 'ai' | 'system';

export type MessageType = 'text' | 'image' | 'file' | 'system_event';

export interface Message {
  id: string;
  conversationId: string;
  senderType: MessageSenderType;
  senderId?: string | null;
  content: string;
  messageType: MessageType;
  isAiSuggested: boolean;
  isApproved: boolean;
  createdAt: string;
}

export interface ConversationSummary {
  id: string;
  status: ConversationStatus;
  subject?: string | null;
  channel: ConversationChannel;
  assignedTo?: string | null;
  lastMessageAt?: string | null;
  lastMessage?: string | null;
  customer?: {
    id: string;
    fullName: string;
    email: string;
  } | null;
}

export interface Conversation {
  id: string;
  hotelId: string;
  userId?: string | null;
  bookingId?: string | null;
  channel: ConversationChannel;
  status: ConversationStatus;
  assignedTo?: string | null;
  subject?: string | null;
  startedAt: string;
  resolvedAt?: string | null;
  lastMessageAt?: string | null;
  messages: Message[];
}

export interface ConversationsParams {
  status?: ConversationStatus;
  page?: number;
  limit?: number;
}

export interface ReplyPayload {
  message: string;
}
