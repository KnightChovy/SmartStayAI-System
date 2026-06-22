import { useQuery } from '@tanstack/react-query';
import { loyaltyService } from '@/services/loyalty.service';
import { queryKeys } from '@/constants/queryKeys';

export function useLoyalty() {
  return useQuery({ queryKey: queryKeys.loyalty.account, queryFn: () => loyaltyService.get() });
}
