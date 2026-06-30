import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/constants/queryKeys';
import { reviewsService } from '@/services/reviews.service';
import type { HotelReviewsParams } from '@/types/reviews.type';

/** `GET /reviews?hotelId=...` — đánh giá công khai của một khách sạn. Public. */
export function useGetReviews(params: HotelReviewsParams) {
  return useQuery({
    queryKey: queryKeys.reviews.byHotel(params),
    queryFn: () => reviewsService.getByHotel(params),
    enabled: Boolean(params.hotelId),
  });
}
