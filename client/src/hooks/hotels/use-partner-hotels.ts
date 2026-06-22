import { useQuery } from '@tanstack/react-query';
import { hotelService } from '@/services/hotel.service';
import { queryKeys } from '@/constants/queryKeys';

/**
 * Danh sách khách sạn của partner đang đăng nhập (`GET /hotels/mine`).
 * Backend lấy partner từ access token nên hook không nhận tham số.
 */
export function usePartnerHotels() {
  return useQuery({
    queryKey: queryKeys.hotels.mine,
    queryFn: hotelService.getMine,
  });
}
