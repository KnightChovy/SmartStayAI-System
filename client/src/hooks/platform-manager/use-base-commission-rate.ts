import { useQuery } from '@tanstack/react-query';
import { platformManagerKeys } from '@/hooks/platform-manager/keys';
import { platformManagerService } from '@/services/platform-manager.service';

/** `GET /platform-manager/commission-rate` — mức nền hiện tại + lịch đã đặt + lịch sử. */
export function useBaseCommissionRate() {
  return useQuery({
    queryKey: platformManagerKeys.baseCommissionRate,
    queryFn: () => platformManagerService.getBaseRate(),
  });
}
