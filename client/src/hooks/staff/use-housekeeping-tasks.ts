import { useQuery } from '@tanstack/react-query';
import { staffService } from '@/services/staff.service';
import type { HousekeepingTaskStatus } from '@/types/staff.types';
import { staffKeys } from './keys';

/** Danh sách task dọn phòng của khách sạn đang trực. */
export function useHousekeepingTasks(
  hotelId: string | undefined,
  status?: HousekeepingTaskStatus
) {
  return useQuery({
    queryKey: staffKeys.housekeeping(hotelId ?? '', status),
    queryFn: () => staffService.listHousekeeping(hotelId as string, status),
    enabled: Boolean(hotelId),
  });
}
