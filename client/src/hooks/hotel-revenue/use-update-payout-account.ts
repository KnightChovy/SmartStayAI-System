import { useMutation, useQueryClient } from '@tanstack/react-query';
import { hotelRevenueKeys } from '@/hooks/hotel-revenue/keys';
import { hotelRevenueService } from '@/services/hotel-revenue.service';
import type { UpdatePayoutAccountDto } from '@/types/hotel-revenue.types';

/**
 * `PUT /hotels/:id/payout-account` — chủ KS đổi tài khoản nhận tiền.
 *
 * Invalidate nhánh ví vì `GET /wallet` trả kèm `payoutAccount`; không invalidate thì thẻ tài
 * khoản trên màn hình vẫn hiện số cũ sau khi lưu.
 */
export function useUpdatePayoutAccount(hotelId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdatePayoutAccountDto) =>
      hotelRevenueService.updatePayoutAccount(hotelId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: hotelRevenueKeys.wallet(hotelId) });
    },
  });
}
