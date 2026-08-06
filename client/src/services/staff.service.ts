import { api } from '@/lib/api';
import type {
  CheckInPayload,
  CheckOutPayload,
  CheckOutResponse,
  HotelBooking,
  HotelBookingDetail,
  HotelBookingsParams,
  HotelBookingsResponse,
  HousekeepingTask,
  HousekeepingTaskStatus,
  RoomBlockListItem,
  RoomStatus,
  StaffHotel,
  StaffRoom,
  StaffRoomsParams,
  StaffRoomsResponse,
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

  /** Hotel booking list (`GET /hotels/:hotelId/bookings`). */
  async listBookings(
    hotelId: string,
    params: HotelBookingsParams = {}
  ): Promise<HotelBookingsResponse> {
    const { data } = await api.get<HotelBookingsResponse>(
      `/hotels/${hotelId}/bookings`,
      {
        params: cleanParams(params),
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

  /** Quickly change a room's status (`PATCH .../status`). */
  async updateRoomStatus(
    hotelId: string,
    roomId: string,
    status: RoomStatus
  ): Promise<StaffRoom> {
    const { data } = await api.patch<StaffRoom>(
      `/hotels/${hotelId}/rooms/${roomId}/status`,
      {
        status,
      }
    );
    return data;
  },
};
