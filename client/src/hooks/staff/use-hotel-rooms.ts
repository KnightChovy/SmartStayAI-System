import { useQuery } from '@tanstack/react-query';
import { staffService } from '@/services/staff.service';
import { staffKeys } from './keys';

/** Danh sách phòng vật lý của khách sạn (bản đồ trạng thái phòng). */
export function useHotelRooms(hotelId: string | undefined) {
  return useQuery({
    queryKey: staffKeys.rooms(hotelId ?? ''),
    queryFn: () => staffService.listRooms(hotelId as string),
    enabled: Boolean(hotelId),
  });
}
