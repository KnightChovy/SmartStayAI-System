import { useMutation, useQueryClient } from '@tanstack/react-query';
import { hotelManagementService } from '@/services/hotel-management.service';
import type { CreatePricingRuleDto } from '@/types/hotel-management.types';
import { hotelManagementKeys } from './keys';

/** POST /:hotelId/pricing-rules — tạo pricing rule. */
export function useCreatePricingRule(hotelId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreatePricingRuleDto) =>
      hotelManagementService.createPricingRule(hotelId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...hotelManagementKeys.all, 'pricing-rules', hotelId],
      });
    },
  });
}
