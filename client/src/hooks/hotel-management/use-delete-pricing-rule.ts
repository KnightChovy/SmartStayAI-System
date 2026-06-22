import { useMutation, useQueryClient } from '@tanstack/react-query';
import { hotelManagementService } from '@/services/hotel-management.service';
import { hotelManagementKeys } from './keys';

/** DELETE /:hotelId/pricing-rules/:ruleId — xoá pricing rule. */
export function useDeletePricingRule(hotelId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ruleId: string) => hotelManagementService.deletePricingRule(hotelId, ruleId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...hotelManagementKeys.all, 'pricing-rules', hotelId],
      });
    },
  });
}
