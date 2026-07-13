import { useMutation, useQueryClient } from '@tanstack/react-query';
import { bookingService } from '@/services/booking.service';
import { queryKeys } from '@/constants/queryKeys';
import type { UpdateReviewPayload } from '@/types/booking.types';

/** Sửa đánh giá của chính mình (`PATCH /reviews/:reviewId`). */
export function useUpdateReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ reviewId, payload }: { reviewId: string; payload: UpdateReviewPayload }) =>
      bookingService.updateReview(reviewId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.reviews.mine });
    },
  });
}
