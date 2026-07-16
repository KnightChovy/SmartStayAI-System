import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/constants/queryKeys';
import { reviewsService } from '@/services/reviews.service';
import { useAuthStore } from '@/stores/authStore';

/**
 * `GET /reviews/me` — đánh giá của chính mình (gồm cả bản chờ duyệt / bị ẩn).
 * Dùng để biết một booking ĐÃ được đánh giá chưa (BE chưa có `GET /bookings/:id/review`,
 * và booking payload cũng không kèm review) → màn chi tiết booking tự tra trong danh sách này.
 */
export function useMyReviews() {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  return useQuery({
    queryKey: queryKeys.reviews.mine(),
    // limit 100: BE chặn tối đa 100/trang. Khách có hơn 100 đánh giá sẽ tra thiếu —
    // đúng giới hạn client web đang có, cần BE thêm endpoint tra theo booking mới hết hẳn.
    queryFn: () => reviewsService.getMine({ limit: 100, sortBy: 'createdAt:desc' }),
    enabled: isAuthenticated,
  });
}
