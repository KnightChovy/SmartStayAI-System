import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/constants/queryKeys';
import { staffService } from '@/services/staff.service';
import type { HousekeepingParams } from '@/types/staff.type';

/** `GET /hotels/:hotelId/housekeeping` — danh sách task dọn phòng. */
export function useHousekeepingTasks(hotelId: string, params: HousekeepingParams = {}) {
  return useQuery({
    queryKey: queryKeys.staff.housekeeping(hotelId, params),
    queryFn: () => staffService.listHousekeeping(hotelId, params),
    enabled: !!hotelId,
  });
}
