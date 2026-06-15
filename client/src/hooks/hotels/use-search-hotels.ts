import { useQuery } from '@tanstack/react-query';
import { hotelService } from '@/services/hotel.service';
import { queryKeys } from '@/constants/queryKeys';
import type { HotelSearchParams } from '@/types/hotel.types';

/** Query danh sách khách sạn theo bộ lọc tìm kiếm. */
export function useSearchHotels(params: HotelSearchParams) {
  return useQuery({
    queryKey: queryKeys.hotels.search(params),
    queryFn: () => hotelService.search(params),
    placeholderData: prev => prev, // giữ data cũ khi đổi filter (đỡ nhấp nháy)
  });
}
