import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { payoutKeys } from '@/hooks/payouts/keys';
import { payoutService } from '@/services/payout.service';
import type { PayoutListParams } from '@/types/payout.types';

/** `GET /hotels/:id/payouts` — lịch sử yêu cầu rút của một khách sạn. */
export function useHotelPayouts(hotelId: string, params: PayoutListParams = {}) {
  return useQuery({
    queryKey: payoutKeys.hotel(hotelId, params),
    queryFn: () => payoutService.listForHotel(hotelId, params),
    enabled: !!hotelId,
    placeholderData: keepPreviousData,
  });
}
