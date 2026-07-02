import { useMutation, useQueryClient } from '@tanstack/react-query';
import { hotelService } from '@/services/hotel.service';
import { queryKeys } from '@/constants/queryKeys';
import type { SetHotelAmenitiesDto } from '@/types/hotel-management.types';

/** `PUT /hotels/:id/amenities` — gán lại toàn bộ tiện nghi khách sạn. */
export function useSetHotelAmenities(hotelId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: SetHotelAmenitiesDto) => hotelService.setAmenities(hotelId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.hotels.amenities(hotelId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.hotels.managed(hotelId) });
    },
  });
}
