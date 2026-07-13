import { useQuery } from '@tanstack/react-query';
import { hotelPropertyKeys } from '@/hooks/hotel-property/keys';
import { hotelPropertyService } from '@/services/hotel-property.service';

/** `GET /hotels/:id/nearby-places` — danh sách địa điểm lân cận của khách sạn (management). */
export function useHotelNearbyPlaces(hotelId: string) {
  return useQuery({
    queryKey: hotelPropertyKeys.nearbyPlaces(hotelId),
    queryFn: () => hotelPropertyService.getNearbyPlaces(hotelId),
    enabled: !!hotelId,
  });
}
