import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/constants/queryKeys';
import { staffService } from '@/services/staff.service';

/** `GET /hotels/:hotelId/room-blocks` — đợt chặn phòng đang mở (mặc định chưa xử lý). */
export function useRoomBlocks(hotelId: string, includeResolved = false) {
  return useQuery({
    queryKey: queryKeys.staff.roomBlocks(hotelId, includeResolved),
    queryFn: () => staffService.listRoomBlocks(hotelId, { includeResolved }),
    enabled: !!hotelId,
  });
}
