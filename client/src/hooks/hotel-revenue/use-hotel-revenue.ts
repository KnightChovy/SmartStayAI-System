import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { hotelRevenueKeys } from '@/hooks/hotel-revenue/keys';
import { hotelRevenueService } from '@/services/hotel-revenue.service';
import type { HotelRevenueParams } from '@/types/hotel-revenue.types';

/** `GET /hotels/:id/revenue` — báo cáo doanh thu 1 khách sạn theo khoảng thời gian. */
export function useHotelRevenue(hotelId: string, params: HotelRevenueParams = {}) {
  return useQuery({
    queryKey: hotelRevenueKeys.revenue(hotelId, params),
    queryFn: () => hotelRevenueService.getRevenue(hotelId, params),
    enabled: !!hotelId,
    // Giữ dữ liệu cũ khi đổi range/groupBy để không nhảy layout.
    placeholderData: keepPreviousData,
  });
}
