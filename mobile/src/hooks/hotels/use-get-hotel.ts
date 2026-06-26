import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/constants/queryKeys';
import { hotelsService } from '@/services/hotels.service';

/** `GET /hotels/:hotelId` — chi tiết một khách sạn. Public. */
export function useGetHotel(hotelId: string) {
  return useQuery({
    queryKey: queryKeys.hotels.detail(hotelId),
    queryFn: () => hotelsService.getById(hotelId),
    enabled: Boolean(hotelId),
  });
}
