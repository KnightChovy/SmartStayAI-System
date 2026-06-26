import { api } from '@/lib/api';
import { cleanParams } from '@/utils/cleanParams';
import type { Paginated } from '@/types/api.type';
import type { Booking, CreateBookingPayload, MyBookingsParams } from '@/types/bookings.type';

/** Tầng gọi API đặt phòng (`/v1/bookings`). Tất cả cần đăng nhập. */
export const bookingsService = {
  /** Tạo booking mới (`POST /bookings`). */
  async create(payload: CreateBookingPayload): Promise<Booking> {
    const { data } = await api.post<Booking>('/bookings', payload);
    return data;
  },

  /** Danh sách booking của tôi (`GET /bookings/me`). */
  async getMine(params: MyBookingsParams = {}): Promise<Paginated<Booking>> {
    const { data } = await api.get<Paginated<Booking>>('/bookings/me', {
      params: cleanParams(params),
    });
    return data;
  },

  /** Chi tiết một booking (`GET /bookings/:bookingId`). */
  async getById(bookingId: string): Promise<Booking> {
    const { data } = await api.get<Booking>(`/bookings/${bookingId}`);
    return data;
  },

  /** Huỷ booking (`PATCH /bookings/:bookingId/cancel`). */
  async cancel(bookingId: string, reason?: string): Promise<Booking> {
    const { data } = await api.patch<Booking>(`/bookings/${bookingId}/cancel`, { reason });
    return data;
  },
};
