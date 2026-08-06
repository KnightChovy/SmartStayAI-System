import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { commissionRateKeys } from '@/hooks/commission-rate/keys';
import { commissionRateService } from '@/services/commission-rate.service';
import type { HotelCommissionRequestsParams } from '@/types/commission-rate.types';

/** `GET /hotels/:hotelId/commission-requests` — lịch sử đơn của khách sạn, mới nhất trước. */
export function useHotelCommissionRequests(
  hotelId: string,
  params: HotelCommissionRequestsParams = {}
) {
  return useQuery({
    queryKey: commissionRateKeys.hotelRequests(hotelId, params),
    queryFn: () => commissionRateService.listHotelRequests(hotelId, params),
    enabled: !!hotelId,
    // Giữ data cũ khi đổi trang/filter để bảng không nhảy layout.
    placeholderData: keepPreviousData,
  });
}
