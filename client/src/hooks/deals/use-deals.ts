import { useQuery } from '@tanstack/react-query';
import { dealService } from '@/services/deal.service';
import { queryKeys } from '@/constants/queryKeys';
import type { DealsParams } from '@/types/deal.types';

/** Deal công khai đang hiệu lực (`GET /v1/deals`) — SS-501. */
export function useDeals(params: DealsParams = {}) {
  return useQuery({
    queryKey: queryKeys.deals.list(params),
    queryFn: () => dealService.list(params),
  });
}
