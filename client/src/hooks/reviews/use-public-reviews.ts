import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { publicReviewService } from '@/services/public-review.service';
import { reviewKeys } from './keys';
import type { PublicReviewsParams } from '@/types/review.types';

/** Đánh giá công khai của một khách sạn (`GET /reviews?hotelId=`). */
export function usePublicReviews(params: PublicReviewsParams) {
  return useQuery({
    queryKey: reviewKeys.public(params),
    queryFn: () => publicReviewService.list(params),
    enabled: !!params.hotelId,
    placeholderData: keepPreviousData,
  });
}
