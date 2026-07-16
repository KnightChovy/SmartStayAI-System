import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { refundKeys } from '@/hooks/refunds/keys';
import { refundService } from '@/services/refund.service';
import type { PlatformRefundsParams } from '@/types/refund.types';

/** `GET /platform-manager/refunds` — hàng đợi hoàn tiền toàn sàn (quyền `manageCommissions`). */
export function usePlatformRefunds(params: PlatformRefundsParams = {}) {
  return useQuery({
    queryKey: refundKeys.platform(params),
    queryFn: () => refundService.listPlatformRefunds(params),
    placeholderData: keepPreviousData,
  });
}
