import { useMutation, useQueryClient } from '@tanstack/react-query';
import { hotelPropertyKeys } from '@/hooks/hotel-property/keys';
import { hotelPropertyService } from '@/services/hotel-property.service';
import type { SetHotelPoliciesDto } from '@/types/hotel-property.types';

/** `PUT /hotels/:id/policies` — thay thế toàn bộ policy/fee của khách sạn. */
export function useSetHotelPolicies(hotelId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: SetHotelPoliciesDto) =>
      hotelPropertyService.setPolicies(hotelId, dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: hotelPropertyKeys.policies(hotelId) });
    },
  });
}
