import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/constants/queryKeys';
import { reviewsService } from '@/services/reviews.service';
import type { CreateReviewPayload } from '@/types/reviews.type';

/** `POST /reviews` — viết đánh giá sau khi trả phòng rồi làm mới list của KS. */
export function useCreateReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateReviewPayload) => reviewsService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.reviews.all() });
    },
  });
}
