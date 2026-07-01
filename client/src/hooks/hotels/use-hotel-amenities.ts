import { useQuery } from '@tanstack/react-query';
import { hotelService } from '@/services/hotel.service';
import { queryKeys } from '@/constants/queryKeys';

/** `GET /hotels/:id/amenities` — tiện nghi đã gán cho khách sạn (management). */
export function useHotelAmenities(hotelId: string) {
  return useQuery({
    queryKey: queryKeys.hotels.amenities(hotelId),
    queryFn: () => hotelService.getAmenities(hotelId),
    enabled: !!hotelId,
  });
}
