import { useQuery } from '@tanstack/react-query';
import { hotelReviewKeys } from '@/hooks/hotel-reviews/keys';
import { hotelReviewService } from '@/services/hotel-review.service';

/** `GET /hotels/:id/reviews/stats` — thống kê tổng hợp review của 1 khách sạn. */
export function useHotelReviewStats(hotelId: string) {
  return useQuery({
    queryKey: hotelReviewKeys.stats(hotelId),
    queryFn: () => hotelReviewService.getStats(hotelId),
    enabled: !!hotelId,
  });
}
