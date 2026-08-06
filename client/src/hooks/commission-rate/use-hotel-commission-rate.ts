import { useQuery } from '@tanstack/react-query';
import { commissionRateKeys } from '@/hooks/commission-rate/keys';
import { commissionRateService } from '@/services/commission-rate.service';

/**
 * `GET /hotels/:hotelId/commission-rate` — mức đang chịu, ưu đãi còn lại,
 * đơn đang chờ và quyền nộp đơn. Một request là đủ để render cả màn hình.
 */
export function useHotelCommissionRate(hotelId: string) {
  return useQuery({
    queryKey: commissionRateKeys.hotelRate(hotelId),
    queryFn: () => commissionRateService.getHotelRate(hotelId),
    enabled: !!hotelId,
  });
}
