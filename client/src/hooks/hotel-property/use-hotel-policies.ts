import { useQuery } from '@tanstack/react-query';
import { hotelPropertyKeys } from '@/hooks/hotel-property/keys';
import { hotelPropertyService } from '@/services/hotel-property.service';

/** `GET /hotels/:id/policies` — danh sách policy/fee của khách sạn (management). */
export function useHotelPolicies(hotelId: string) {
  return useQuery({
    queryKey: hotelPropertyKeys.policies(hotelId),
    queryFn: () => hotelPropertyService.getPolicies(hotelId),
    enabled: !!hotelId,
  });
}
