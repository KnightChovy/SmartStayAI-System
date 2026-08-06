import { useQuery } from '@tanstack/react-query';
import { staffService } from '@/services/staff.service';
import { staffKeys } from './keys';
import type { StaffLiveOptions } from './live';

/**
 * Các đợt chặn phòng của khách sạn (`GET /hotels/:hotelId/room-blocks`).
 *
 * Khác `activeBlock` đi kèm mỗi phòng trong `useHotelRooms`: chỗ đó BE chỉ tra đợt chặn có hiệu lực
 * **HÔM NAY**, nên không dùng để tính tồn kho của những ngày tới được.
 */
export function useRoomBlocks(
  hotelId: string | undefined,
  includeResolved = false,
  options: StaffLiveOptions = {}
) {
  return useQuery({
    queryKey: staffKeys.roomBlocks(hotelId ?? '', includeResolved),
    queryFn: () => staffService.listRoomBlocks(hotelId as string, includeResolved),
    enabled: Boolean(hotelId),
    ...options,
  });
}
