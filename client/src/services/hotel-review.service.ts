import { api } from '@/lib/api';
import type {
  HotelReviewsParams,
  HotelReviewsResponse,
  HotelReviewStats,
  PublicReviewsParams,
} from '@/types/hotel-review.types';

/** Bỏ các field undefined/null/rỗng để query string gọn gàng. */
function cleanParams<T extends object>(params: T): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
  );
}

export const hotelReviewService = {
  /** Danh sách review của 1 khách sạn (mọi status) — `GET /hotels/:id/reviews` (owner/manageHotels). */
  async list(
    hotelId: string,
    params: HotelReviewsParams = {}
  ): Promise<HotelReviewsResponse> {
    const { data } = await api.get<HotelReviewsResponse>(`/hotels/${hotelId}/reviews`, {
      params: cleanParams(params),
    });
    return data;
  },

  /** Thống kê review của 1 khách sạn cho CHỦ/manager — `GET /hotels/:id/reviews/stats` (auth). */
  async getStats(hotelId: string): Promise<HotelReviewStats> {
    const { data } = await api.get<HotelReviewStats>(`/hotels/${hotelId}/reviews/stats`);
    return data;
  },

  /**
   * Thống kê review CÔNG KHAI — `GET /hotels/:id/review-stats` (public, chỉ đếm review published).
   * Cùng shape với bản partner; dùng cho trang chi tiết guest (điểm tổng + phân bố sao).
   */
  async getPublicStats(hotelId: string): Promise<HotelReviewStats> {
    const { data } = await api.get<HotelReviewStats>(`/hotels/${hotelId}/review-stats`);
    return data;
  },

  /**
   * Review CÔNG KHAI của 1 khách sạn (`GET /reviews?hotelId=`) — dùng cho trang chi tiết guest.
   * BE chỉ trả review `published`; không cần đăng nhập.
   */
  async listPublic(
    hotelId: string,
    params: PublicReviewsParams = {}
  ): Promise<HotelReviewsResponse> {
    const { data } = await api.get<HotelReviewsResponse>('/reviews', {
      params: cleanParams({ hotelId, ...params }),
    });
    return data;
  },
};
