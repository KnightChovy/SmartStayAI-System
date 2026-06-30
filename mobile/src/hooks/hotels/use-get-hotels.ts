import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/constants/queryKeys';
import { hotelsService } from '@/services/hotels.service';
import type { HotelSearchParams } from '@/types/hotels.type';

/** `GET /hotels` — tìm khách sạn theo bộ lọc. Public. */
export function useGetHotels(params: HotelSearchParams = {}) {
  return useQuery({
    queryKey: queryKeys.hotels.search(params),
    queryFn: () => hotelsService.search(params),
  });
}
