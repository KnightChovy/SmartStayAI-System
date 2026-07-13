import { useMutation, useQueryClient } from '@tanstack/react-query';
import { hotelPropertyKeys } from '@/hooks/hotel-property/keys';
import { hotelPropertyService } from '@/services/hotel-property.service';
import type { SetHotelContactsDto } from '@/types/hotel-property.types';

/** `PUT /hotels/:id/contacts` — thay thế toàn bộ contact của khách sạn. */
export function useSetHotelContacts(hotelId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: SetHotelContactsDto) =>
      hotelPropertyService.setContacts(hotelId, dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: hotelPropertyKeys.contacts(hotelId) });
    },
  });
}
