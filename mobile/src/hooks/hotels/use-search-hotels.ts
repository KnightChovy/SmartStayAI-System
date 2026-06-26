import { useQuery } from '@tanstack/react-query';
import { hotelService } from '@/services/hotel.service';
import type { HotelSearchParams } from '@/types/hotel.types';
import { hotelKeys } from './keys';

export function useSearchHotels(params: HotelSearchParams = {}) {
  return useQuery({
    queryKey: hotelKeys.search(params),
    queryFn: () => hotelService.search(params),
  });
}
