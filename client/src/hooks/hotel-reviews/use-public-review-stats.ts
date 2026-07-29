import { useQuery } from '@tanstack/react-query';
import { hotelReviewKeys } from '@/hooks/hotel-reviews/keys';
import { hotelReviewService } from '@/services/hotel-review.service';

/**
 * Thống kê review CÔNG KHAI của 1 khách sạn (`GET /hotels/:id/review-stats`) — SS-202.
 * Trả điểm tổng + trung bình từng tiêu chí + phân bố sao (countByStar). Không cần đăng nhập.
 */
export function usePublicReviewStats(hotelId: string) {
  return useQuery({
    queryKey: hotelReviewKeys.publicStats(hotelId),
    queryFn: () => hotelReviewService.getPublicStats(hotelId),
    enabled: !!hotelId,
  });
}
