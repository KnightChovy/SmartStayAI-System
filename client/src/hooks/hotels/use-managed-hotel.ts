import { useQuery } from '@tanstack/react-query';
import { hotelService } from '@/services/hotel.service';
import { queryKeys } from '@/constants/queryKeys';

/**
 * Chi tiết khách sạn cho chủ/manager (`GET /hotels/:id/manage`).
 * Khác `useHotel` (public) ở chỗ xem được cả khách sạn chưa mở bán.
 */
export function useManagedHotel(hotelId: string) {
  return useQuery({
    queryKey: queryKeys.hotels.managed(hotelId),
    queryFn: () => hotelService.getManaged(hotelId),
    enabled: !!hotelId,
  });
}
