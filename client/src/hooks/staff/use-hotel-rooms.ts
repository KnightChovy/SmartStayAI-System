import { useQuery } from '@tanstack/react-query';
import { staffService } from '@/services/staff.service';
import { staffKeys } from './keys';

/** Physical room list for the hotel (room status map). */
export function useHotelRooms(hotelId: string | undefined) {
  return useQuery({
    queryKey: staffKeys.rooms(hotelId ?? ''),
    queryFn: () => staffService.listRooms(hotelId as string),
    enabled: Boolean(hotelId),
  });
}
