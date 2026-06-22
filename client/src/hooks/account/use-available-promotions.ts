import { useQuery } from '@tanstack/react-query';
import { promotionService } from '@/services/promotion.service';
import { queryKeys } from '@/constants/queryKeys';

export function useAvailablePromotions() {
  return useQuery({ queryKey: queryKeys.vouchers.available, queryFn: () => promotionService.listAvailable() });
}
