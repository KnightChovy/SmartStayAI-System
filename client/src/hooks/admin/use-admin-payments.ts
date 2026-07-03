import { useQuery } from '@tanstack/react-query';

import { adminKeys } from '@/hooks/admin/keys';
import { adminService } from '@/services/admin.service';
import type { AdminPaymentsParams } from '@/types/admin.types';

export function useAdminPayments(params: AdminPaymentsParams = {}) {
  return useQuery({
    queryKey: adminKeys.payments(params),
    queryFn: () => adminService.listPayments(params),
  });
}
