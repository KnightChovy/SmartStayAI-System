import { useMutation, useQueryClient } from '@tanstack/react-query';
import { commissionRateKeys } from '@/hooks/commission-rate/keys';
import { platformManagerKeys } from '@/hooks/platform-manager/keys';
import { platformManagerService } from '@/services/platform-manager.service';
import type {
  CommissionRateRequest,
  ReviewCommissionRequestDto,
} from '@/types/commission-rate.types';

interface ReviewCommissionRequestVars {
  requestId: string;
  dto: ReviewCommissionRequestDto;
}

/**
 * `PATCH /platform-manager/commission-requests/:requestId/review`.
 *
 * Duyệt sẽ tạo ưu đãi 12 tháng cho khách sạn ⇒ invalidate cả nhánh hoa hồng phía đối tác.
 * Dùng `onSettled` (không phải `onSuccess`): khi thua race backend trả 400 "Đơn này đã được
 * xử lý" — đúng lúc đó hàng chờ đang là data cũ nên cần refetch nhất.
 */
export function useReviewCommissionRequest() {
  const queryClient = useQueryClient();
  return useMutation<
    CommissionRateRequest,
    unknown,
    ReviewCommissionRequestVars
  >({
    mutationFn: ({ requestId, dto }) =>
      platformManagerService.reviewCommissionRequest(requestId, dto),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: platformManagerKeys.all });
      queryClient.invalidateQueries({ queryKey: commissionRateKeys.all });
    },
  });
}
