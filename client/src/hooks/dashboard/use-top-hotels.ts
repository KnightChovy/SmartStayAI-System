import { useMemo } from 'react';
import { usePlatformAnalytics } from '@/hooks/analytics';
import type { TopHotel } from '@/types/dashboard.types';

const TOP_LIMIT = 5;

/**
 * Top khách sạn theo SỐ BOOKING — `GET /platform-manager/analytics?topLimit=5` → `topHotels[]`.
 *
 * Hai giới hạn có thật của BE, đã phản ánh vào UI thay vì giấu đi:
 *  • KHÔNG có doanh thu theo khách sạn ở phạm vi toàn sàn (chỉ có `/hotels/:id/revenue` cho
 *    từng khách sạn — xếp hạng bằng cách đó là N+1 request, quá đắt cho một widget dashboard).
 *  • `topHotels` là số liệu TOÀN THỜI GIAN, không theo date-range đang chọn.
 */
export function useTopHotels() {
  const query = usePlatformAnalytics({ topLimit: TOP_LIMIT });

  const data = useMemo<TopHotel[] | undefined>(() => {
    if (!query.data) return undefined;
    return query.data.topHotels.map(h => ({
      hotelId: h.hotelId,
      name: h.name,
      bookings: h.bookings,
    }));
  }, [query.data]);

  return {
    data,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: () => {
      void query.refetch();
    },
  };
}
