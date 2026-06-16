import { useMutation, useQueryClient } from '@tanstack/react-query';
import { reviewService } from '@/services/review.service';
import { queryKeys } from '@/constants/queryKeys';
import type { CreateReviewInput } from '@/types/account.types';

export function useCreateReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateReviewInput) => reviewService.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.reviews.mine }),
  });
}
