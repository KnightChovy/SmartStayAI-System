import { useQuery } from '@tanstack/react-query';

import { adminKeys } from '@/hooks/admin/keys';
import { adminService } from '@/services/admin.service';
import type { AdminHotelsParams } from '@/types/admin.types';

export function useAdminHotels(params: AdminHotelsParams = {}) {
  return useQuery({
    queryKey: adminKeys.hotels(params),
    queryFn: () => adminService.listHotels(params),
  });
}
