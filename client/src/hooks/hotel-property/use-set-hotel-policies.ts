import { useMutation, useQueryClient } from '@tanstack/react-query';
import { hotelPropertyKeys } from '@/hooks/hotel-property/keys';
import { hotelPropertyService } from '@/services/hotel-property.service';
import { queryKeys } from '@/constants/queryKeys';
import type { SetHotelPoliciesDto } from '@/types/hotel-property.types';

export function useSetHotelPolicies(hotelId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: SetHotelPoliciesDto) =>
      hotelPropertyService.setPolicies(hotelId, dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: hotelPropertyKeys.policies(hotelId) });
      qc.invalidateQueries({ queryKey: queryKeys.hotels.detail(hotelId) });
    },
  });
}
