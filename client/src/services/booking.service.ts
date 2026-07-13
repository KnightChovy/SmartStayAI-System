import { api } from '@/lib/api';
import type { Paginated } from '@/types/api.types';
import type {
  Booking,
  CreateBookingPayload,
  CreateReviewPayload,
  MyBookingsParams,
} from '@/types/booking.types';

/** Bỏ field rỗng khỏi query string. */
function cleanParams<T extends object>(params: T): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
  );
}

export const bookingService = {
  /** Tạo booking mới (`POST /bookings`). Cần đăng nhập. */
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

  /** Chi tiết booking (`GET /bookings/:id`). */
  async getById(bookingId: string): Promise<Booking> {
    const { data } = await api.get<Booking>(`/bookings/${bookingId}`);
    return data;
  },

  /** Hủy booking (`PATCH /bookings/:id/cancel`). */
  async cancel(bookingId: string, reason?: string): Promise<Booking> {
    const { data } = await api.patch<Booking>(`/bookings/${bookingId}/cancel`, { reason });
    return data;
  },

  /** Viết đánh giá cho booking đã trả phòng (`POST /reviews`). */
  async createReview(payload: CreateReviewPayload): Promise<void> {
    await api.post('/reviews', payload);
  },
};
