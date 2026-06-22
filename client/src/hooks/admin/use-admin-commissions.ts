import { useQuery } from '@tanstack/react-query';

import { adminKeys } from '@/hooks/admin/keys';
import { adminService } from '@/services/admin.service';
import type { AdminCommissionsParams } from '@/types/admin.types';

export function useAdminCommissions(params: AdminCommissionsParams = {}) {
  return useQuery({
    queryKey: adminKeys.commissions(params),
    queryFn: () => adminService.listCommissions(params),
  });
}
