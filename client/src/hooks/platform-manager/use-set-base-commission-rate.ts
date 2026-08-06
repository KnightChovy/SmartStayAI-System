import { useMutation, useQueryClient } from '@tanstack/react-query';
import { commissionRateKeys } from '@/hooks/commission-rate/keys';
import { platformManagerKeys } from '@/hooks/platform-manager/keys';
import { platformManagerService } from '@/services/platform-manager.service';
import type {
  PlatformBaseRate,
  SetBaseRateDto,
} from '@/types/commission-rate.types';

/**
 * `PUT /platform-manager/commission-rate` — đặt mức nền mới cho toàn sàn.
 *
 * Ưu đãi riêng đang còn hạn KHÔNG bị đụng tới, nhưng `rateAfterExpiry` của chúng đổi theo ⇒
 * phải invalidate cả nhánh hoa hồng phía đối tác, không chỉ mức nền.
 */
export function useSetBaseCommissionRate() {
  const queryClient = useQueryClient();
  return useMutation<PlatformBaseRate, unknown, SetBaseRateDto>({
    mutationFn: dto => platformManagerService.setBaseRate(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: platformManagerKeys.baseCommissionRate,
      });
      queryClient.invalidateQueries({ queryKey: commissionRateKeys.all });
    },
  });
}
