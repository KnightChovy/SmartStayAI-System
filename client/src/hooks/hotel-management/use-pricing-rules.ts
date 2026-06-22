import { useQuery } from '@tanstack/react-query';
import { hotelManagementService } from '@/services/hotel-management.service';
import type { PricingRuleListParams } from '@/types/hotel-management.types';
import { hotelManagementKeys } from './keys';

/** GET /:hotelId/pricing-rules — list pricing rule (sort priority desc, createdAt desc). */
export function usePricingRules(
  hotelId: string | null | undefined,
  params: PricingRuleListParams = {}
) {
  return useQuery({
    queryKey: hotelManagementKeys.pricingRules(hotelId ?? '', params),
    queryFn: () => hotelManagementService.getPricingRules(hotelId!, params),
    enabled: !!hotelId,
  });
}
