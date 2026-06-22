import { useQuery } from '@tanstack/react-query';

import { adminKeys } from '@/hooks/admin/keys';
import { adminService } from '@/services/admin.service';
import type { AdminUsersParams } from '@/types/admin.types';

export function useAdminUsers(params: AdminUsersParams = {}) {
  return useQuery({
    queryKey: adminKeys.users(params),
    queryFn: () => adminService.listUsers(params),
  });
}
