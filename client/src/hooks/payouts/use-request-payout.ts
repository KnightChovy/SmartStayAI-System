import { useMutation, useQueryClient } from '@tanstack/react-query';
import { payoutKeys } from '@/hooks/payouts/keys';
import { hotelRevenueKeys } from '@/hooks/hotel-revenue/keys';
import { payoutService } from '@/services/payout.service';
import type { RequestPayoutDto } from '@/types/payout.types';

/**
 * `POST /hotels/:id/payouts` — chủ KS tạo yêu cầu rút.
 *
 * Invalidate CẢ ví: tạo yêu cầu là tiền **rời `balanceAvailable` ngay** sang `pendingPayout`,
 * không đợi duyệt. Không invalidate thì hai con số trên màn hình còn nguyên và đối tác tưởng
 * mình rút được thêm lần nữa.
 */
export function useRequestPayout(hotelId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: RequestPayoutDto) =>
      payoutService.request(hotelId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: payoutKeys.all });
      queryClient.invalidateQueries({ queryKey: hotelRevenueKeys.all });
    },
  });
}
