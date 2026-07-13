import { useMutation, useQueryClient } from '@tanstack/react-query';
import { hotelPropertyKeys } from '@/hooks/hotel-property/keys';
import { hotelPropertyService } from '@/services/hotel-property.service';
import type { SetHotelNearbyPlacesDto } from '@/types/hotel-property.types';

/** `PUT /hotels/:id/nearby-places` — thay thế toàn bộ địa điểm lân cận của khách sạn. */
export function useSetHotelNearbyPlaces(hotelId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: SetHotelNearbyPlacesDto) =>
      hotelPropertyService.setNearbyPlaces(hotelId, dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: hotelPropertyKeys.nearbyPlaces(hotelId) });
    },
  });
}
