import { useMutation, useQueryClient } from '@tanstack/react-query';
import { refundKeys } from '@/hooks/refunds/keys';
import { refundService } from '@/services/refund.service';
import type { Refund, ReviewRefundDto } from '@/types/refund.types';

interface ReviewRefundVars {
  hotelId: string;
  refundId: string;
  dto: ReviewRefundDto;
}

/**
 * `PATCH /hotels/:hotelId/refunds/:refundId/review` — khách sạn duyệt / từ chối.
 * Duyệt xong yêu cầu rơi sang hàng đợi chuyển khoản của Platform Manager ⇒ invalidate cả 2 danh sách.
 *
 * `onSettled` (không phải `onSuccess`) là CỐ Ý: khi thua race hoặc khi job 3 ngày vừa tự duyệt,
 * BE trả 400 — đúng lúc đó danh sách đang hiển thị là data CŨ, cần refetch nhất.
 */
export function useReviewRefund() {
  const queryClient = useQueryClient();
  return useMutation<Refund, unknown, ReviewRefundVars>({
    mutationFn: ({ hotelId, refundId, dto }) => refundService.review(hotelId, refundId, dto),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: refundKeys.all });
    },
  });
}
