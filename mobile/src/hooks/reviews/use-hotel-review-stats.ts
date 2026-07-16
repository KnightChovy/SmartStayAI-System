import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/constants/queryKeys';
import { reviewsService } from '@/services/reviews.service';

/**
 * `GET /hotels/:hotelId/review-stats` — điểm trung bình + tổng số + phân bố sao, tính
 * trên TOÀN BỘ đánh giá đã duyệt của khách sạn (public, không cần đăng nhập).
 */
export function useHotelReviewStats(hotelId: string) {
  return useQuery({
    queryKey: queryKeys.reviews.hotelStats(hotelId),
    queryFn: () => reviewsService.getHotelStats(hotelId),
    enabled: Boolean(hotelId),
  });
}
