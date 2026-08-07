import { useMutation, useQueryClient } from '@tanstack/react-query';
import { payoutKeys } from '@/hooks/payouts/keys';
import { hotelRevenueKeys } from '@/hooks/hotel-revenue/keys';
import { payoutService } from '@/services/payout.service';
import type { ReviewPayoutDto } from '@/types/payout.types';

/**
 * `PATCH /platform-manager/payouts/:id/review` — duyệt / từ chối một yêu cầu rút.
 *
 * Từ chối sẽ HOÀN tiền về `balanceAvailable` của khách sạn nên phải invalidate cả nhánh ví.
 */
export function useReviewPayout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      payoutId,
      payload,
    }: {
      payoutId: string;
      payload: ReviewPayoutDto;
    }) => payoutService.review(payoutId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: payoutKeys.all });
      queryClient.invalidateQueries({ queryKey: hotelRevenueKeys.all });
    },
  });
}
