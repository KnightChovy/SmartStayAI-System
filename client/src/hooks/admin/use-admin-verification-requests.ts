import { useQuery } from '@tanstack/react-query';

import { adminKeys } from '@/hooks/admin/keys';
import { adminService } from '@/services/admin.service';
import type { AdminVerificationRequestsParams } from '@/types/admin.types';

export function useAdminVerificationRequests(
  params: AdminVerificationRequestsParams = {}
) {
  return useQuery({
    queryKey: adminKeys.verificationRequests(params),
    queryFn: () => adminService.listVerificationRequests(params),
  });
}
