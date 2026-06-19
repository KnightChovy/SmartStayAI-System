import { useQuery } from '@tanstack/react-query';
import { staffService } from '@/services/staff.service';
import { staffKeys } from './keys';

/** Public hotel list for the staff workplace picker. */
export function useStaffHotels() {
  return useQuery({
    queryKey: staffKeys.hotels,
    queryFn: staffService.listHotels,
    staleTime: 5 * 60 * 1000,
  });
}
