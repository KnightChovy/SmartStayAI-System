import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { adminKeys } from '@/hooks/admin/keys';
import { adminService } from '@/services/admin.service';
import type { AdminRevenueParams } from '@/types/admin.types';

export function useAdminRevenue(params: AdminRevenueParams = {}) {
  return useQuery({
    queryKey: adminKeys.revenue(params),
    queryFn: () => adminService.getPlatformRevenue(params),
    placeholderData: keepPreviousData,
  });
}
