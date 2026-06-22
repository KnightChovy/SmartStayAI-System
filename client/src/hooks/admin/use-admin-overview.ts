import { useQuery } from '@tanstack/react-query';

import { adminKeys } from '@/hooks/admin/keys';
import { adminService } from '@/services/admin.service';

export function useAdminOverview() {
  return useQuery({
    queryKey: adminKeys.overview,
    queryFn: () => adminService.getOverview(),
  });
}
