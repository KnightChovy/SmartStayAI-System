import { useQuery } from '@tanstack/react-query';
import { hotelPropertyKeys } from '@/hooks/hotel-property/keys';
import { hotelPropertyService } from '@/services/hotel-property.service';

/** `GET /hotels/:id/charges` — thuế/phí engine dùng để tính tiền (management). */
export function useHotelCharges(hotelId: string) {
  return useQuery({
    queryKey: hotelPropertyKeys.charges(hotelId),
    queryFn: () => hotelPropertyService.getCharges(hotelId),
    enabled: !!hotelId,
  });
}
