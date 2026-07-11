import { useQuery } from '@tanstack/react-query';

import { adminKeys } from '@/hooks/admin/keys';
import { adminService } from '@/services/admin.service';

export function useAdminUser(userId: string | undefined) {
  return useQuery({
    queryKey: adminKeys.user(userId ?? ''),
    queryFn: () => adminService.getUser(userId as string),
    enabled: Boolean(userId),
  });
}
