import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { payoutKeys } from '@/hooks/payouts/keys';
import { payoutService } from '@/services/payout.service';
import type { PayoutListParams } from '@/types/payout.types';

/** `GET /platform-manager/payouts` — hàng chờ rút tiền toàn sàn. */
export function usePlatformPayouts(params: PayoutListParams = {}) {
  return useQuery({
    queryKey: payoutKeys.platform(params),
    queryFn: () => payoutService.listForPlatform(params),
    placeholderData: keepPreviousData,
  });
}
