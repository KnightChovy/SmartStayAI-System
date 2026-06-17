import { useQuery } from '@tanstack/react-query';
import { staffService } from '@/services/staff.service';
import { staffKeys } from './keys';

/** Danh sách khách sạn (công khai) cho bộ chọn nơi làm việc của staff. */
export function useStaffHotels() {
  return useQuery({
    queryKey: staffKeys.hotels,
    queryFn: staffService.listHotels,
    staleTime: 5 * 60 * 1000,
  });
}
