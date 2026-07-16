import { api } from '@/lib/api';
import { cleanParams } from '@/utils/cleanParams';
import type { Paginated } from '@/types/api.type';
import type {
  CreateReviewPayload,
  HotelReviewsParams,
  MyReview,
  MyReviewsParams,
  Review,
  ReviewStats,
  UpdateReviewPayload,
} from '@/types/reviews.type';

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

  /** Đánh giá của chính mình (`GET /reviews/me`) — gồm cả bản chờ duyệt/bị ẩn. */
  async getMine(params: MyReviewsParams = {}): Promise<Paginated<MyReview>> {
    const { data } = await api.get<Paginated<MyReview>>('/reviews/me', {
      params: cleanParams(params),
    });
    return data;
  },

  /** Sửa đánh giá của chính mình (`PATCH /reviews/:reviewId`). */
  async update(reviewId: string, payload: UpdateReviewPayload): Promise<MyReview> {
    const { data } = await api.patch<MyReview>(`/reviews/${reviewId}`, payload);
    return data;
  },

  /**
   * Thống kê đánh giá của khách sạn (`GET /hotels/:hotelId/review-stats`). **Public**.
   * Dùng cái này thay vì tự tính trung bình từ trang review vừa tải — tính tay chỉ ra
   * trung bình của đúng mấy review đang hiện, không phải của cả khách sạn.
   *
   * ⚠️ Đường dẫn là `/review-stats` (có gạch nối). `/hotels/:id/reviews/stats` là bản
   * dành cho chủ khách sạn, có auth — khách gọi vào sẽ 403.
   */
  async getHotelStats(hotelId: string): Promise<ReviewStats> {
    const { data } = await api.get<ReviewStats>(`/hotels/${hotelId}/review-stats`);
    return data;
  },
};
