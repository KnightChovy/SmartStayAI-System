import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/constants/queryKeys';
import { reviewsService } from '@/services/reviews.service';
import type { UpdateReviewPayload } from '@/types/reviews.type';

/** `PATCH /reviews/:reviewId` — sửa đánh giá của chính mình. */
export function useUpdateReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ reviewId, payload }: { reviewId: string; payload: UpdateReviewPayload }) =>
      reviewsService.update(reviewId, payload),
    onSuccess: () => {
      // Sửa điểm là đổi cả trung bình của khách sạn ⇒ làm mới toàn bộ nhánh reviews
      // (list công khai + thống kê + danh sách của tôi).
      queryClient.invalidateQueries({ queryKey: queryKeys.reviews.all() });
    },
  });
}
