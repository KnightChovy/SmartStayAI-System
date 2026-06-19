import { api } from '@/lib/api';
import type { Paginated } from '@/types/api.types';
import type {
  CheckInPayload,
  CheckOutPayload,
  HotelBooking,
  HotelBookingDetail,
  HotelBookingsParams,
  HotelBookingsResponse,
  HousekeepingTask,
  HousekeepingTaskStatus,
  RoomStatus,
  StaffHotel,
  StaffRoom,
  StaffRoomsResponse,
} from '@/types/staff.types';

/** Bỏ field rỗng khỏi query string. */
function cleanParams<T extends object>(params: T): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
  );
}

/**
 * Tầng gọi API cho cổng nhân viên (lễ tân / housekeeping). Mọi endpoint nằm dưới
 * `/hotels/:hotelId/...`; backend tự kiểm tra staff có được phân công vào khách sạn
 * (getOperableHotel) nên FE chỉ cần truyền đúng hotelId đang trực.
 */
export const staffService = {
  /** Danh sách khách sạn công khai — dùng cho bộ chọn "nơi làm việc" của staff. */
  async listHotels(): Promise<StaffHotel[]> {
    const { data } = await api.get<Paginated<StaffHotel>>('/hotels', {
      params: { limit: 100 },
    });
    return data.results;
  },

  // ----- Booking / quầy lễ tân -----

  /** Danh sách booking của khách sạn (`GET /hotels/:hotelId/bookings`). */
  async listBookings(
    hotelId: string,
    params: HotelBookingsParams = {}
  ): Promise<HotelBookingsResponse> {
    const { data } = await api.get<HotelBookingsResponse>(`/hotels/${hotelId}/bookings`, {
      params: cleanParams(params),
    });
    return data;
  },

  /** Chi tiết một booking (`GET /hotels/:hotelId/bookings/:bookingId`). */
  async getBooking(hotelId: string, bookingId: string): Promise<HotelBookingDetail> {
    const { data } = await api.get<HotelBookingDetail>(
      `/hotels/${hotelId}/bookings/${bookingId}`
    );
    return data;
  },

  /** Check-in khách (`POST .../check-in`). */
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

  /** Check-out khách (`POST .../check-out`). */
  async checkOut(
    hotelId: string,
    bookingId: string,
    payload: CheckOutPayload = {}
  ): Promise<HotelBooking> {
    const { data } = await api.post<HotelBooking>(
      `/hotels/${hotelId}/bookings/${bookingId}/check-out`,
      cleanParams(payload)
    );
    return data;
  },

  /** Thu tiền mặt cho booking trả tại khách sạn (`POST .../record-cash-payment`). */
  async recordCashPayment(hotelId: string, bookingId: string): Promise<HotelBooking> {
    const { data } = await api.post<HotelBooking>(
      `/hotels/${hotelId}/bookings/${bookingId}/record-cash-payment`
    );
    return data;
  },

  /** Đánh dấu khách không đến (`POST .../no-show`). */
  async markNoShow(hotelId: string, bookingId: string): Promise<HotelBooking> {
    const { data } = await api.post<HotelBooking>(
      `/hotels/${hotelId}/bookings/${bookingId}/no-show`
    );
    return data;
  },

  // ----- Housekeeping -----

  /** Danh sách task dọn phòng (`GET /hotels/:hotelId/housekeeping`). */
  async listHousekeeping(
    hotelId: string,
    status?: HousekeepingTaskStatus
  ): Promise<HousekeepingTask[]> {
    const { data } = await api.get<HousekeepingTask[]>(`/hotels/${hotelId}/housekeeping`, {
      params: cleanParams({ status }),
    });
    return data;
  },

  /** Hoàn thành task dọn phòng (`POST .../complete`). */
  async completeHousekeeping(hotelId: string, taskId: string): Promise<HousekeepingTask> {
    const { data } = await api.post<HousekeepingTask>(
      `/hotels/${hotelId}/housekeeping/${taskId}/complete`
    );
    return data;
  },

  // ----- Phòng vật lý -----

  /** Danh sách phòng vật lý (`GET /hotels/:hotelId/rooms`). */
  async listRooms(hotelId: string): Promise<StaffRoom[]> {
    const { data } = await api.get<StaffRoomsResponse>(`/hotels/${hotelId}/rooms`);
    return data.results;
  },

  /** Đổi nhanh trạng thái phòng (`PATCH .../status`). */
  async updateRoomStatus(
    hotelId: string,
    roomId: string,
    status: RoomStatus
  ): Promise<StaffRoom> {
    const { data } = await api.patch<StaffRoom>(`/hotels/${hotelId}/rooms/${roomId}/status`, {
      status,
    });
    return data;
  },
};
