import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/constants/queryKeys';
import { hotelsService } from '@/services/hotels.service';
import type { RoomTypeParams } from '@/types/hotels.type';

/** `GET /hotels/:hotelId/room-types` — loại phòng của một khách sạn. Public. */
export function useGetRoomTypes(hotelId: string, params: RoomTypeParams = {}) {
  return useQuery({
    queryKey: queryKeys.hotels.roomTypes(hotelId, params),
    queryFn: () => hotelsService.getRoomTypes(hotelId, params),
    enabled: Boolean(hotelId),
  });
}
