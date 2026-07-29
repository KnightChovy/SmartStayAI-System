import { useQuery } from '@tanstack/react-query';
import { platformService } from '@/services/platform.service';
import { queryKeys } from '@/constants/queryKeys';
import type { FeaturedReviewsParams } from '@/types/platform.types';

/** Testimonial nổi bật cho landing (`GET /v1/reviews/featured`) — SS-004. */
export function useFeaturedReviews(params: FeaturedReviewsParams = {}) {
  return useQuery({
    queryKey: queryKeys.platform.featuredReviews(params),
    queryFn: () => platformService.getFeaturedReviews(params),
    staleTime: 10 * 60 * 1000,
  });
}
