import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { platformManagerKeys } from '@/hooks/platform-manager/keys';
import { platformManagerService } from '@/services/platform-manager.service';
import type { PlatformCommissionRequestsParams } from '@/types/commission-rate.types';

/**
 * `GET /platform-manager/commission-requests` — hàng chờ duyệt đơn hoa hồng.
 * Backend sắp CŨ NHẤT TRƯỚC để không đối tác nào bị bỏ quên.
 */
export function useCommissionRequests(
  params: PlatformCommissionRequestsParams = {}
) {
  return useQuery({
    queryKey: platformManagerKeys.commissionRequests(params),
    queryFn: () => platformManagerService.listCommissionRequests(params),
    placeholderData: keepPreviousData,
  });
}
