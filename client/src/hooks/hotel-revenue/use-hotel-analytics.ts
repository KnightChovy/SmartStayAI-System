import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { hotelRevenueKeys } from '@/hooks/hotel-revenue/keys';
import { hotelRevenueService } from '@/services/hotel-revenue.service';
import type { PerformanceQueryParams } from '@/types/platform-manager.types';

/** `GET /hotels/:id/analytics` — hiệu suất vận hành + điểm tổng hợp của 1 khách sạn. */
export function useHotelAnalytics(hotelId: string, params: PerformanceQueryParams = {}) {
  return useQuery({
    queryKey: hotelRevenueKeys.analytics(hotelId, params),
    queryFn: () => hotelRevenueService.getAnalytics(hotelId, params),
    enabled: !!hotelId,
    placeholderData: keepPreviousData,
  });
}
