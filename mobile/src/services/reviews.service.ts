import { api } from '@/lib/api';
import { cleanParams } from '@/utils/cleanParams';
import type { Paginated } from '@/types/api.type';
import type { CreateReviewPayload, HotelReviewsParams, Review } from '@/types/reviews.type';

/** Tầng gọi API đánh giá khách sạn (`/v1/reviews`). */
export const reviewsService = {
  /** Khách viết đánh giá sau khi trả phòng (`POST /reviews`). Cần đăng nhập. */
  async create(payload: CreateReviewPayload): Promise<Review> {
    const { data } = await api.post<Review>('/reviews', payload);
    return data;
  },

  /** Đánh giá công khai của một khách sạn (`GET /reviews?hotelId=...`). Public. */
  async getByHotel(params: HotelReviewsParams): Promise<Paginated<Review>> {
    const { data } = await api.get<Paginated<Review>>('/reviews', {
      params: cleanParams(params),
    });
    return data;
  },

  /** Chi tiết một đánh giá (`GET /reviews/:reviewId`). Public. */
  async getById(reviewId: string): Promise<Review> {
    const { data } = await api.get<Review>(`/reviews/${reviewId}`);
    return data;
  },
};
