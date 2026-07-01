import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/constants/queryKeys';
import { staffService } from '@/services/staff.service';
import type { StaffRoomsParams } from '@/types/staff.type';

/** `GET /hotels/:hotelId/rooms` — danh sách phòng vật lý cho bản đồ phòng. */
export function useHotelRooms(hotelId: string, params: StaffRoomsParams = {}) {
  return useQuery({
    queryKey: queryKeys.staff.rooms(hotelId, params),
    queryFn: () => staffService.listRooms(hotelId, params),
    enabled: !!hotelId,
  });
}
