import { useQuery } from '@tanstack/react-query';
import { staffService } from '@/services/staff.service';
import { staffKeys } from './keys';

/** Hotels the logged-in staff member is assigned to (workplace picker). */
export function useStaffHotels() {
  return useQuery({
    queryKey: staffKeys.hotels,
    queryFn: staffService.listMyHotels,
    staleTime: 5 * 60 * 1000,
  });
}
