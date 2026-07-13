import { api } from '@/lib/api';
import type { Paginated } from '@/types/api.types';
import type { PublicReview, PublicReviewsParams } from '@/types/review.types';

/** Bỏ các field undefined/rỗng để query string gọn gàng. */
function cleanParams<T extends object>(params: T): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(params).filter(
      ([, v]) => v !== undefined && v !== null && v !== ''
    )
  );
}

export const publicReviewService = {
  /** Đánh giá công khai (đã published) của một khách sạn (`GET /reviews`). Public. */
  async list(params: PublicReviewsParams): Promise<Paginated<PublicReview>> {
    const { data } = await api.get<Paginated<PublicReview>>('/reviews', {
      params: cleanParams(params),
    });
    return data;
  },
};
