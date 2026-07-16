import { useQuery } from '@tanstack/react-query';
import { hotelReviewService } from '@/services/hotel-review.service';
import { hotelReviewKeys } from './keys';
import type { PublicReviewsParams } from '@/types/hotel-review.types';

/**
 * Review công khai của 1 khách sạn (`GET /reviews?hotelId=`) — dùng ở trang chi tiết guest.
 * Không cần đăng nhập; BE chỉ trả review đã `published`.
 */
export function usePublicHotelReviews(hotelId: string, params: PublicReviewsParams = {}) {
  return useQuery({
    queryKey: hotelReviewKeys.publicList(hotelId, params),
    queryFn: () => hotelReviewService.listPublic(hotelId, params),
    enabled: !!hotelId,
  });
}
