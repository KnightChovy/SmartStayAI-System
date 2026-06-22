import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { hotelManagementService } from '@/services/hotel-management.service';
import type { RoomListParams } from '@/types/hotel-management.types';
import { hotelManagementKeys } from './keys';

/** GET /:hotelId/rooms — list phòng vật lý (phân trang, lọc status/loại phòng). */
export function useRooms(hotelId: string | null | undefined, params: RoomListParams = {}) {
  return useQuery({
    queryKey: hotelManagementKeys.rooms(hotelId ?? '', params),
    queryFn: () => hotelManagementService.getRooms(hotelId!, params),
    enabled: !!hotelId,
    placeholderData: keepPreviousData,
  });
}
