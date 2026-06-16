import { useQuery } from '@tanstack/react-query';
import { reviewService } from '@/services/review.service';
import { queryKeys } from '@/constants/queryKeys';

export function useMyReviews() {
  return useQuery({ queryKey: queryKeys.reviews.mine, queryFn: () => reviewService.listMine() });
}
