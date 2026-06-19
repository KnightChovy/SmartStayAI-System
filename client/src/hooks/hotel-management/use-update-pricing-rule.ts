import { useMutation, useQueryClient } from '@tanstack/react-query';
import { hotelManagementService } from '@/services/hotel-management.service';
import type { UpdatePricingRuleDto } from '@/types/hotel-management.types';
import { hotelManagementKeys } from './keys';

/** PUT /:hotelId/pricing-rules/:ruleId — cập nhật pricing rule. */
export function useUpdatePricingRule(hotelId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ruleId, dto }: { ruleId: string; dto: UpdatePricingRuleDto }) =>
      hotelManagementService.updatePricingRule(hotelId, ruleId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...hotelManagementKeys.all, 'pricing-rules', hotelId],
      });
    },
  });
}
