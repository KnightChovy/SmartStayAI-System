import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/constants/queryKeys';
import { hotelRevenueKeys } from '@/hooks/hotel-revenue/keys';
import { refundKeys } from '@/hooks/refunds/keys';
import { refundService } from '@/services/refund.service';
import type { ProcessRefundDto, Refund } from '@/types/refund.types';

interface ProcessRefundVars {
  refundId: string;
  dto: ProcessRefundDto;
}

/**
 * `PATCH /platform-manager/refunds/:refundId/process` — đánh dấu đã chuyển khoản xong.
 *
 * Bước này KHÔNG chỉ đổi trạng thái refund: trong cùng một transaction BE còn tính lại hoa hồng
 * trên phần khách sạn thực giữ, TRỪ VÍ khách sạn, và set Payment → `refunded` khi hoàn 100%.
 * Vì vậy phải invalidate cả doanh thu/ví và booking, không chỉ danh sách refund.
 */
export function useProcessRefund() {
  const queryClient = useQueryClient();
  return useMutation<Refund, unknown, ProcessRefundVars>({
    mutationFn: ({ refundId, dto }) => refundService.process(refundId, dto),
    // `onSettled`: khi thua race BE trả 400 — đúng lúc đó danh sách đang là data cũ, cần refetch nhất.
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: refundKeys.all });
      queryClient.invalidateQueries({ queryKey: hotelRevenueKeys.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all });
    },
  });
}
