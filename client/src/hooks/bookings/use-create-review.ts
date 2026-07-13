import { useMutation, useQueryClient } from '@tanstack/react-query';
import { bookingService } from '@/services/booking.service';
import { queryKeys } from '@/constants/queryKeys';
import type { CreateReviewPayload } from '@/types/booking.types';

/** Viết đánh giá cho một booking đã trả phòng (`POST /reviews`). */
export function useCreateReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateReviewPayload) => bookingService.createReview(payload),
    onSuccess: (_data, { bookingId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.bookings.detail(bookingId) });
      qc.invalidateQueries({ queryKey: queryKeys.reviews.mine });
    },
  });
}
