import type { AxiosRequestConfig } from 'axios';
import { api } from '@/lib/api';
import type { Paginated } from '@/types/api.types';
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
  RoomStatus,
  StaffHotel,
  StaffRoom,
  StaffRoomsResponse,
} from '@/types/staff.types';

/**
 * Axios config that sets the interceptor's `_retry` flag (see `lib/api.ts`). On a 401/403 the
 * shared response interceptor normally tries to refresh the token (and can log the user out on
 * repeated failures). For the hotel-access probes below, 403 is an EXPECTED answer, so we set
 * `_retry: true` to make the interceptor skip its refresh branch and just reject cleanly.
 */
const skipAuthRetry = { _retry: true } as unknown as AxiosRequestConfig;

/** Drop empty fields from the query string. */
function cleanParams<T extends object>(params: T): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
  );
}

/**
 * API layer for the staff portal (front desk / housekeeping). All endpoints live under
 * `/hotels/:hotelId/...`; the backend verifies whether the staff member is assigned to the
 * hotel (getOperableHotel), so the FE only needs to pass the correct active hotelId.
 */
export const staffService = {
  /**
   * Hotels the logged-in staff member can actually operate.
   *
   * The backend exposes no endpoint that lists a staff member's assigned hotels (and we can't add
   * one), so we discover them client-side: list the public hotels, then probe each staff-operable
   * endpoint (guarded by `getOperableHotel`) and keep only the ones that don't return 403. The
   * probes use `skipAuthRetry` so the expected 403s never trigger the token-refresh interceptor.
   */
  async listMyHotels(): Promise<StaffHotel[]> {
    const { data } = await api.get<Paginated<StaffHotel>>('/hotels', {
      params: { limit: 100 },
    });
    const hotels = data.results;

    const probes = await Promise.allSettled(
      hotels.map(hotel =>
        api.get(`/hotels/${hotel.id}/bookings`, { params: { limit: 1 }, ...skipAuthRetry })
      )
    );

    return hotels.filter((_, i) => probes[i].status === 'fulfilled');
  },

  // ----- Booking / front desk -----

  /** Hotel booking list (`GET /hotels/:hotelId/bookings`). */
  async listBookings(
    hotelId: string,
    params: HotelBookingsParams = {}
  ): Promise<HotelBookingsResponse> {
    const { data } = await api.get<HotelBookingsResponse>(`/hotels/${hotelId}/bookings`, {
      params: cleanParams(params),
    });
    return data;
  },

  /** Detail of a single booking (`GET /hotels/:hotelId/bookings/:bookingId`). */
  async getBooking(hotelId: string, bookingId: string): Promise<HotelBookingDetail> {
    const { data } = await api.get<HotelBookingDetail>(
      `/hotels/${hotelId}/bookings/${bookingId}`
    );
    return data;
  },

  /** Tra booking từ mã QR/e-voucher (`GET .../bookings/lookup?voucherCode=`). */
  async lookupBooking(hotelId: string, voucherCode: string): Promise<HotelBookingDetail> {
    const { data } = await api.get<HotelBookingDetail>(`/hotels/${hotelId}/bookings/lookup`, {
      params: { voucherCode },
    });
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
  async recordCashPayment(hotelId: string, bookingId: string): Promise<HotelBooking> {
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
    const { data } = await api.get<HousekeepingTask[]>(`/hotels/${hotelId}/housekeeping`, {
      params: cleanParams({ status }),
    });
    return data;
  },

  /** Complete a housekeeping task (`POST .../complete`). */
  async completeHousekeeping(hotelId: string, taskId: string): Promise<HousekeepingTask> {
    const { data } = await api.post<HousekeepingTask>(
      `/hotels/${hotelId}/housekeeping/${taskId}/complete`
    );
    return data;
  },

  // ----- Physical rooms -----

  /** Physical room list (`GET /hotels/:hotelId/rooms`). */
  async listRooms(hotelId: string): Promise<StaffRoom[]> {
    const { data } = await api.get<StaffRoomsResponse>(`/hotels/${hotelId}/rooms`);
    return data.results;
  },

  /** Quickly change a room's status (`PATCH .../status`). */
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
