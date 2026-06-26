import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/constants/queryKeys';
import { reviewsService } from '@/services/reviews.service';

/** `GET /reviews/:reviewId` — chi tiết một đánh giá. Public. */
export function useGetReview(reviewId: string) {
  return useQuery({
    queryKey: queryKeys.reviews.detail(reviewId),
    queryFn: () => reviewsService.getById(reviewId),
    enabled: Boolean(reviewId),
  });
}
