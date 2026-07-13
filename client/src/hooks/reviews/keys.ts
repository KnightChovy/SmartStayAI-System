import type { PublicReviewsParams } from '@/types/review.types';

/** Query keys cho đánh giá công khai. */
export const reviewKeys = {
  public: (params: PublicReviewsParams) =>
    ['reviews', 'public', params] as const,
};
