import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { hotelReviewKeys } from '@/hooks/hotel-reviews/keys';
import { hotelReviewService } from '@/services/hotel-review.service';
import type { HotelReviewsParams } from '@/types/hotel-review.types';

/** `GET /hotels/:id/reviews` — danh sách review (mọi status) của 1 khách sạn. */
export function useHotelReviews(hotelId: string, params: HotelReviewsParams = {}) {
  return useQuery({
    queryKey: hotelReviewKeys.list(hotelId, params),
    queryFn: () => hotelReviewService.list(hotelId, params),
    enabled: !!hotelId,
    placeholderData: keepPreviousData,
  });
}
