import { useQuery } from '@tanstack/react-query';
import { hotelPropertyKeys } from '@/hooks/hotel-property/keys';
import { hotelPropertyService } from '@/services/hotel-property.service';

/** `GET /hotels/:id/contacts` — danh sách contact của khách sạn (management). */
export function useHotelContacts(hotelId: string) {
  return useQuery({
    queryKey: hotelPropertyKeys.contacts(hotelId),
    queryFn: () => hotelPropertyService.getContacts(hotelId),
    enabled: !!hotelId,
  });
}
