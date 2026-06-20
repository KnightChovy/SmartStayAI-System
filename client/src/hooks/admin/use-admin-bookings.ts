import { useQuery } from '@tanstack/react-query';

import { adminKeys } from '@/hooks/admin/keys';
import { adminService } from '@/services/admin.service';

export function useAdminBookings() {
  return useQuery({
    queryKey: adminKeys.bookings,
    queryFn: () => adminService.listBookings(),
  });
}
