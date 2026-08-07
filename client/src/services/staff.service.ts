import { api } from '@/lib/api';
import type {
  AssignRoomPayload,
  CheckInPayload,
  CheckOutPayload,
  CheckOutResponse,
  CreateRoomBlockPayload,
  CreateRoomBlockResult,
  HkStatus,
  InventoryCalendarResponse,
  HotelBooking,
  HotelBookingDetail,
  HotelBookingsParams,
  HotelBookingsResponse,
  HousekeepingTask,
  HousekeepingTaskStatus,
  RoomBlock,
  RoomBlockListItem,
  StaffHotel,
  StaffRoom,
  StaffRoomsParams,
  StaffRoomsResponse,
  UpdateRoomBlockPayload,
  UpdateRoomBlockResult,
} from '@/types/staff.types';

/** Drop empty fields from the query string. */
function cleanParams<T extends object>(params: T): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(params).filter(
      ([, v]) => v !== undefined && v !== null && v !== ''
    )
  );
}

/**
 * API layer for the staff portal (front desk / housekeeping). All endpoints live under
 * `/hotels/:hotelId/...`; the backend verifies whether the staff member is assigned to the
 * hotel (getOperableHotel), so the FE only needs to pass the correct active hotelId.
 */
export const staffService = {
  /**
   * Hotels the logged-in staff member is assigned to (`GET /hotels/staff/mine`).
   *
   * Backend đọc staff id từ access token và trả về các khách sạn đang được phân công
   * (`hotel_staff_assignments`, `unassignedAt = null`), kèm ảnh primary + `_count` loại phòng/phòng.
   * Trả cả khách sạn chưa mở bán — đúng hơn cách probe cũ (vốn chỉ thấy khách sạn public).
   */
  async listMyHotels(): Promise<StaffHotel[]> {
    const { data } = await api.get<StaffHotel[]>('/hotels/staff/mine');
    return data;
  },

  // ----- Booking / front desk -----

  /**
   * Hotel booking list (`GET /hotels/:hotelId/bookings`).
   *
   * `status` nhận cả mảng ⇒ phải serialize thành **khoá lặp lại không ngoặc**
   * (`status=confirmed&status=checked_in`). Mặc định axios sinh `status[]=…`; Express parse được cả
   * hai, nhưng dạng lặp là dạng được chấp nhận rộng nhất — không phụ thuộc query parser của server.
   */
  async listBookings(
    hotelId: string,
    params: HotelBookingsParams = {}
  ): Promise<HotelBookingsResponse> {
    const { data } = await api.get<HotelBookingsResponse>(
      `/hotels/${hotelId}/bookings`,
      {
        params: cleanParams(params),
        paramsSerializer: { indexes: null },
      }
    );
    return data;
  },

  /** Detail of a single booking (`GET /hotels/:hotelId/bookings/:bookingId`). */
  async getBooking(
    hotelId: string,
    bookingId: string
  ): Promise<HotelBookingDetail> {
    const { data } = await api.get<HotelBookingDetail>(
      `/hotels/${hotelId}/bookings/${bookingId}`
    );
    return data;
  },

  /** Tra booking từ mã QR/e-voucher (`GET .../bookings/lookup?voucherCode=`). */
  async lookupBooking(
    hotelId: string,
    voucherCode: string
  ): Promise<HotelBookingDetail> {
    const { data } = await api.get<HotelBookingDetail>(
      `/hotels/${hotelId}/bookings/lookup`,
      {
        params: { voucherCode },
      }
    );
    return data;
  },

  /**
   * Chốt TRƯỚC phòng vật lý cho một đơn đã xác nhận (`POST .../bookings/:bookingId/assign-room`).
   *
   * Trước khi có endpoint này, phòng chỉ được chọn lúc check-in ⇒ một đơn `confirmed` cho đêm nay
   * chiếm một suất trong kho nhưng không gắn với phòng nào, và bản đồ phòng phải **đoán**. Gọi lại
   * với `roomId` khác = đổi phòng (BE thay bản ghi cũ), không cần gỡ trước.
   */
  async assignRoom(
    hotelId: string,
    bookingId: string,
    payload: AssignRoomPayload
  ): Promise<HotelBooking> {
    const { data } = await api.post<HotelBooking>(
      `/hotels/${hotelId}/bookings/${bookingId}/assign-room`,
      payload
    );
    return data;
  },

  /**
   * Gỡ phòng đã gán trước (`DELETE .../bookings/:bookingId/assign-room`).
   * Chỉ dùng được khi đơn còn `confirmed` — khách đã nhận phòng thì phải đi qua Front desk.
   */
  async releaseAssignedRoom(hotelId: string, bookingId: string): Promise<HotelBooking> {
    const { data } = await api.delete<HotelBooking>(
      `/hotels/${hotelId}/bookings/${bookingId}/assign-room`
    );
    return data;
  },

  /** Check in a guest (`POST .../check-in`). */
  async checkIn(
    hotelId: string,
    bookingId: string,
    payload: CheckInPayload = {}
  ): Promise<HotelBooking> {
    const { data } = await api.post<HotelBooking>(
      `/hotels/${hotelId}/bookings/${bookingId}/check-in`,
      cleanParams(payload)
    );
    return data;
  },

  /** Check out a guest (`POST .../check-out`) — trả về booking kèm hoá đơn vừa xuất. */
  async checkOut(
    hotelId: string,
    bookingId: string,
    payload: CheckOutPayload = {}
  ): Promise<CheckOutResponse> {
    const { data } = await api.post<CheckOutResponse>(
      `/hotels/${hotelId}/bookings/${bookingId}/check-out`,
      cleanParams(payload)
    );
    return data;
  },

  /** Record a cash payment for a pay-at-hotel booking (`POST .../record-cash-payment`). */
  async recordCashPayment(
    hotelId: string,
    bookingId: string
  ): Promise<HotelBooking> {
    const { data } = await api.post<HotelBooking>(
      `/hotels/${hotelId}/bookings/${bookingId}/record-cash-payment`
    );
    return data;
  },

  /** Mark a guest as a no-show (`POST .../no-show`). */
  async markNoShow(hotelId: string, bookingId: string): Promise<HotelBooking> {
    const { data } = await api.post<HotelBooking>(
      `/hotels/${hotelId}/bookings/${bookingId}/no-show`
    );
    return data;
  },

  // ----- Housekeeping -----

  /** Housekeeping task list (`GET /hotels/:hotelId/housekeeping`). */
  async listHousekeeping(
    hotelId: string,
    status?: HousekeepingTaskStatus
  ): Promise<HousekeepingTask[]> {
    const { data } = await api.get<HousekeepingTask[]>(
      `/hotels/${hotelId}/housekeeping`,
      {
        params: cleanParams({ status }),
      }
    );
    return data;
  },

  /** Complete a housekeeping task (`POST .../complete`). */
  async completeHousekeeping(
    hotelId: string,
    taskId: string
  ): Promise<HousekeepingTask> {
    const { data } = await api.post<HousekeepingTask>(
      `/hotels/${hotelId}/housekeeping/${taskId}/complete`
    );
    return data;
  },

  // ----- Physical rooms -----

  /**
   * Physical room list (`GET /hotels/:hotelId/rooms`).
   *
   * ⚠️ BE mặc định chỉ trả **50 phòng/trang** (trần 200) — gọi không kèm `limit` là khách sạn lớn bị
   * cắt bớt trong im lặng, room map hiện thiếu phòng mà không báo gì.
   */
  async listRooms(
    hotelId: string,
    params: StaffRoomsParams = {}
  ): Promise<StaffRoomsResponse> {
    const { data } = await api.get<StaffRoomsResponse>(
      `/hotels/${hotelId}/rooms`,
      { params: cleanParams(params) }
    );
    return data;
  },

  /**
   * Đợt chặn phòng của khách sạn (`GET /hotels/:hotelId/room-blocks`).
   * Mặc định BE chỉ trả đợt **chưa xử lý xong** (`resolvedAt = null`) — đúng thứ cần để tính tồn kho.
   */
  async listRoomBlocks(
    hotelId: string,
    includeResolved = false
  ): Promise<RoomBlockListItem[]> {
    const { data } = await api.get<RoomBlockListItem[]>(
      `/hotels/${hotelId}/room-blocks`,
      { params: includeResolved ? { includeResolved: true } : undefined }
    );
    return data;
  },

  /*
   * CỐ Ý KHÔNG nối `PATCH .../rooms/:roomId/status` (lối vào cũ của Room map): endpoint đó **không
   * có chiều thời gian** — BE dịch `maintenance` thành một đợt chặn cứng 7 ngày kể từ hôm nay và
   * `available` thành "gỡ MỌI đợt chặn còn hiệu lực". Đổi tình trạng theo ngày dùng
   * `createRoomBlock` / `resolveRoomBlock`; đổi trạng thái dọn của hôm nay dùng `updateHousekeeping`.
   */

  /**
   * Đổi trạng thái buồng phòng (`PATCH .../housekeeping`).
   * Đây là trạng thái **của lúc này**, không gắn ngày — chỉ có nghĩa với ngày hôm nay.
   */
  async updateHousekeeping(
    hotelId: string,
    roomId: string,
    hkStatus: HkStatus
  ): Promise<StaffRoom> {
    const { data } = await api.patch<StaffRoom>(
      `/hotels/${hotelId}/rooms/${roomId}/housekeeping`,
      { hkStatus }
    );
    return data;
  },

  /*
   * CỐ Ý KHÔNG nối `POST .../blocks?dryRun=true`: nhánh "xem trước" của BE **không bao giờ chạy**
   * (middleware `validate` convert `dryRun` thành boolean, controller lại so với chuỗi `'true'`)
   * nên mỗi lần xem trước là chặn thật một phòng — đã tái hiện trên deploy. Bản xem trước của FE
   * tính tại client bằng `previewRoomBlockLocally`, dùng đúng dữ liệu đang hiện trên lịch.
   */

  /** Chặn một phòng theo khoảng ngày (`POST .../blocks`). */
  async createRoomBlock(
    hotelId: string,
    roomId: string,
    payload: CreateRoomBlockPayload
  ): Promise<CreateRoomBlockResult> {
    const { data } = await api.post<CreateRoomBlockResult>(
      `/hotels/${hotelId}/rooms/${roomId}/blocks`,
      cleanParams(payload)
    );
    return data;
  },

  /**
   * Gia hạn / rút ngắn / sửa lý do một đợt chặn đang mở (`PATCH .../blocks/:blockId`).
   *
   * Trước khi có endpoint này, muốn dời ngày xong việc thì phải gỡ đợt cũ rồi tạo đợt mới — mất
   * lịch sử chi phí sự cố, mà `createBlock` lại từ chối hai đợt `ooo` chồng nhau nên thao tác còn
   * vòng vèo. BE chỉ nhận `endDate`/`reason`/`estimatedCost` (xem `UpdateRoomBlockPayload`).
   */
  async updateRoomBlock(
    hotelId: string,
    roomId: string,
    blockId: string,
    payload: UpdateRoomBlockPayload
  ): Promise<UpdateRoomBlockResult> {
    const { data } = await api.patch<UpdateRoomBlockResult>(
      `/hotels/${hotelId}/rooms/${roomId}/blocks/${blockId}`,
      cleanParams(payload)
    );
    return data;
  },

  /**
   * Lịch tồn kho theo TỪNG ĐÊM (`GET /hotels/:hotelId/inventory/calendar?from&to`).
   *
   * Nguồn DUY NHẤT cho lưới tồn kho. Trước đây FE tự ghép `rooms` + `room-blocks` + `bookings` rồi
   * **nhân bản công thức của BE** — cách đó không đọc được bảng `room_availability` nên lệch ngay
   * khi đối tác chỉnh tay `totalRooms`, và trôi mỗi lần BE đổi công thức.
   *
   * ⚠️ BE chặn tối đa **92 ngày** một lượt.
   */
  async getInventoryCalendar(
    hotelId: string,
    from: string,
    to: string
  ): Promise<InventoryCalendarResponse> {
    const { data } = await api.get<InventoryCalendarResponse>(
      `/hotels/${hotelId}/inventory/calendar`,
      { params: { from, to } }
    );
    return data;
  },

  /**
   * Đánh dấu đợt chặn đã xử lý xong (`DELETE .../blocks/:blockId`).
   * BE không xoá dòng, chỉ set `resolvedAt` và trả phòng về kho bán cho những ngày CÒN LẠI.
   */
  async resolveRoomBlock(
    hotelId: string,
    roomId: string,
    blockId: string
  ): Promise<RoomBlock> {
    const { data } = await api.delete<RoomBlock>(
      `/hotels/${hotelId}/rooms/${roomId}/blocks/${blockId}`
    );
    return data;
  },
};
