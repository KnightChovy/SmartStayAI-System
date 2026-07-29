import { api } from '@/lib/api';
import type {
  FeaturedReview,
  FeaturedReviewsParams,
  PlatformStats,
} from '@/types/platform.types';

export const platformService = {
  /** Số liệu tổng của sàn (`GET /v1/platform/stats`). Public. */
  async getStats(): Promise<PlatformStats> {
    const { data } = await api.get<PlatformStats>('/platform/stats');
    return data;
  },

  /** Testimonial nổi bật (`GET /v1/reviews/featured`). Public. Trả mảng thẳng. */
  async getFeaturedReviews(params: FeaturedReviewsParams = {}): Promise<FeaturedReview[]> {
    const { data } = await api.get<FeaturedReview[]>('/reviews/featured', { params });
    return data;
  },
};
