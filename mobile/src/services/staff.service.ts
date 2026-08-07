import { api } from '@/lib/api';
import { cleanParams } from '@/utils/cleanParams';
import type { Paginated } from '@/types/api.type';
import type {
  AssignRoomPayload,
  CheckInPayload,
  CheckOutPayload,
  Conversation,
  ConversationSummary,
  ConversationsParams,
  CreateRoomBlockPayload,
  HousekeepingParams,
  HousekeepingTask,
  InventoryCalendarResponse,
  Message,
  ReplyPayload,
  RoomBlock,
  RoomBlockResult,
  StaffAssignedHotel,
  StaffBooking,
  StaffBookingsParams,
  StaffRoom,
  StaffRoomsParams,
  RoomStatusUpdatable,
  UpdateRoomBlockPayload,
} from '@/types/staff.type';

export const staffService = {
  /* ---------- Khách sạn được phân công ---------- */

  async listMyHotels(): Promise<StaffAssignedHotel[]> {
    const { data } = await api.get<StaffAssignedHotel[]>('/hotels/staff/mine');
    return data;
  },

  /* ---------- Booking (check-in / check-out) ---------- */

  /** `GET /hotels/:hotelId/bookings` — danh sách booking của KS (phân trang). */
  async listBookings(
    hotelId: string,
    params: StaffBookingsParams = {},
  ): Promise<Paginated<StaffBooking>> {
    const { data } = await api.get<Paginated<StaffBooking>>(
      `/hotels/${hotelId}/bookings`,
      { params: cleanParams(params) },
    );
    return data;
  },

  /** `GET /hotels/:hotelId/bookings/lookup?voucherCode=` — tra booking từ QR. */
  async lookupBooking(
    hotelId: string,
    voucherCode: string,
  ): Promise<StaffBooking> {
    const { data } = await api.get<StaffBooking>(
      `/hotels/${hotelId}/bookings/lookup`,
      { params: { voucherCode } },
    );
    return data;
  },

  /** `GET /hotels/:hotelId/bookings/:bookingId` — chi tiết 1 booking. */
  async getBooking(hotelId: string, bookingId: string): Promise<StaffBooking> {
    const { data } = await api.get<StaffBooking>(
      `/hotels/${hotelId}/bookings/${bookingId}`,
    );
    return data;
  },

  /** `POST /hotels/:hotelId/bookings/:bookingId/check-in` — nhận phòng. */
  async checkIn(
    hotelId: string,
    bookingId: string,
    payload: CheckInPayload = {},
  ): Promise<StaffBooking> {
    const { data } = await api.post<StaffBooking>(
      `/hotels/${hotelId}/bookings/${bookingId}/check-in`,
      payload,
    );
    return data;
  },

  /** `POST /hotels/:hotelId/bookings/:bookingId/assign-room` — chốt trước phòng vật lý. */
  async assignRoom(
    hotelId: string,
    bookingId: string,
    payload: AssignRoomPayload,
  ): Promise<StaffBooking> {
    const { data } = await api.post<StaffBooking>(
      `/hotels/${hotelId}/bookings/${bookingId}/assign-room`,
      payload,
    );
    return data;
  },

  /** `DELETE /hotels/:hotelId/bookings/:bookingId/assign-room` — gỡ phòng đã gán trước. */
  async releaseAssignedRoom(hotelId: string, bookingId: string): Promise<StaffBooking> {
    const { data } = await api.delete<StaffBooking>(
      `/hotels/${hotelId}/bookings/${bookingId}/assign-room`,
    );
    return data;
  },

  /** `POST /hotels/:hotelId/bookings/:bookingId/check-out` — trả phòng + xuất HĐ. */
  async checkOut(
    hotelId: string,
    bookingId: string,
    payload: CheckOutPayload = {},
  ): Promise<StaffBooking> {
    const { data } = await api.post<StaffBooking>(
      `/hotels/${hotelId}/bookings/${bookingId}/check-out`,
      payload,
    );
    return data;
  },

  /** `POST /hotels/:hotelId/bookings/:bookingId/no-show` — đánh dấu khách không đến. */
  async markNoShow(hotelId: string, bookingId: string): Promise<StaffBooking> {
    const { data } = await api.post<StaffBooking>(
      `/hotels/${hotelId}/bookings/${bookingId}/no-show`,
    );
    return data;
  },

  /** `POST /hotels/:hotelId/bookings/:bookingId/record-cash-payment` — thu tiền mặt. */
  async recordCashPayment(
    hotelId: string,
    bookingId: string,
  ): Promise<StaffBooking> {
    const { data } = await api.post<StaffBooking>(
      `/hotels/${hotelId}/bookings/${bookingId}/record-cash-payment`,
    );
    return data;
  },

  /** `GET /hotels/:hotelId/housekeeping` — danh sách task dọn phòng (mảng trần). */
  async listHousekeeping(
    hotelId: string,
    params: HousekeepingParams = {},
  ): Promise<HousekeepingTask[]> {
    const { data } = await api.get<HousekeepingTask[]>(
      `/hotels/${hotelId}/housekeeping`,
      { params: cleanParams(params) },
    );
    return data;
  },

  /** `POST /hotels/:hotelId/housekeeping/:taskId/complete` — hoàn thành task. */
  async completeHousekeeping(
    hotelId: string,
    taskId: string,
  ): Promise<HousekeepingTask> {
    const { data } = await api.post<HousekeepingTask>(
      `/hotels/${hotelId}/housekeeping/${taskId}/complete`,
    );
    return data;
  },

  /** `GET /hotels/:hotelId/rooms` — danh sách phòng vật lý (phân trang). */
  async listRooms(
    hotelId: string,
    params: StaffRoomsParams = {},
  ): Promise<Paginated<StaffRoom>> {
    const { data } = await api.get<Paginated<StaffRoom>>(
      `/hotels/${hotelId}/rooms`,
      { params: cleanParams(params) },
    );
    return data;
  },

  /** `PATCH /hotels/:hotelId/rooms/:roomId/status` — đổi nhanh trạng thái phòng. */
  async updateRoomStatus(
    hotelId: string,
    roomId: string,
    status: RoomStatusUpdatable,
  ): Promise<StaffRoom> {
    const { data } = await api.patch<StaffRoom>(
      `/hotels/${hotelId}/rooms/${roomId}/status`,
      { status },
    );
    return data;
  },

  /** `GET /hotels/:hotelId/room-blocks` — danh sách đợt chặn phòng (mặc định chỉ đợt chưa xử lý). */
  async listRoomBlocks(
    hotelId: string,
    params: { includeResolved?: boolean } = {},
  ): Promise<RoomBlock[]> {
    const { data } = await api.get<RoomBlock[]>(
      `/hotels/${hotelId}/room-blocks`,
      { params: cleanParams(params) },
    );
    return data;
  },

  /** `POST /hotels/:hotelId/rooms/:roomId/blocks` — tạo đợt chặn (khẩn cấp). */
  async createRoomBlock(
    hotelId: string,
    roomId: string,
    payload: CreateRoomBlockPayload,
  ): Promise<RoomBlockResult> {
    const { data } = await api.post<RoomBlockResult>(
      `/hotels/${hotelId}/rooms/${roomId}/blocks`,
      payload,
    );
    return data;
  },

  /** `PATCH /hotels/:hotelId/rooms/:roomId/blocks/:blockId` — gia hạn/rút ngắn đợt chặn. */
  async updateRoomBlock(
    hotelId: string,
    roomId: string,
    blockId: string,
    payload: UpdateRoomBlockPayload,
  ): Promise<RoomBlockResult> {
    const { data } = await api.patch<RoomBlockResult>(
      `/hotels/${hotelId}/rooms/${roomId}/blocks/${blockId}`,
      payload,
    );
    return data;
  },

  /** `DELETE /hotels/:hotelId/rooms/:roomId/blocks/:blockId` — đóng đợt chặn (soft resolve). */
  async resolveRoomBlock(hotelId: string, roomId: string, blockId: string): Promise<RoomBlock> {
    const { data } = await api.delete<RoomBlock>(
      `/hotels/${hotelId}/rooms/${roomId}/blocks/${blockId}`,
    );
    return data;
  },

  /** `GET /hotels/:hotelId/inventory/calendar` — số phòng còn bán được mỗi đêm, theo loại phòng.
   *  `to` tối đa cách `from` 92 ngày (BE chặn). */
  async getInventoryCalendar(
    hotelId: string,
    from: string,
    to: string,
  ): Promise<InventoryCalendarResponse> {
    const { data } = await api.get<InventoryCalendarResponse>(
      `/hotels/${hotelId}/inventory/calendar`,
      { params: { from, to } },
    );
    return data;
  },

  /** `GET /hotels/:hotelId/conversations` — danh sách hội thoại inbox (phân trang). */
  async listConversations(
    hotelId: string,
    params: ConversationsParams = {},
  ): Promise<Paginated<ConversationSummary>> {
    const { data } = await api.get<Paginated<ConversationSummary>>(
      `/hotels/${hotelId}/conversations`,
      { params: cleanParams(params) },
    );
    return data;
  },

  /** `GET /hotels/:hotelId/conversations/:conversationId` — chi tiết + messages. */
  async getConversation(
    hotelId: string,
    conversationId: string,
  ): Promise<Conversation> {
    const { data } = await api.get<Conversation>(
      `/hotels/${hotelId}/conversations/${conversationId}`,
    );
    return data;
  },

  /** `POST /hotels/:hotelId/conversations/:conversationId/reply` — staff trả lời. */
  async replyConversation(
    hotelId: string,
    conversationId: string,
    payload: ReplyPayload,
  ): Promise<Message> {
    const { data } = await api.post<Message>(
      `/hotels/${hotelId}/conversations/${conversationId}/reply`,
      payload,
    );
    return data;
  },

  /** `POST /hotels/:hotelId/conversations/:conversationId/resolve` — đánh dấu xử lý xong. */
  async resolveConversation(
    hotelId: string,
    conversationId: string,
  ): Promise<Conversation> {
    const { data } = await api.post<Conversation>(
      `/hotels/${hotelId}/conversations/${conversationId}/resolve`,
    );
    return data;
  },
};
