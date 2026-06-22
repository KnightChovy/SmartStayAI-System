import { useQuery } from '@tanstack/react-query';
import { amenityService } from '@/services/amenity.service';
import type { Amenity } from '@/types/hotel.types';
import { hotelManagementKeys } from './keys';

/** GET /amenities — danh mục tiện nghi (static reference, cache lâu). */
export function useAmenities(category?: Amenity['category']) {
  return useQuery({
    queryKey: hotelManagementKeys.amenities(category),
    queryFn: () => amenityService.getAmenities(category),
    staleTime: Infinity,
  });
}
