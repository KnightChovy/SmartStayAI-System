import { useQuery } from '@tanstack/react-query';
import { hotelPropertyKeys } from '@/hooks/hotel-property/keys';
import { hotelPropertyService } from '@/services/hotel-property.service';

/** `GET /hotels/:id/room-types/:roomTypeId/beds` — cấu hình giường của một loại phòng. */
export function useRoomBeds(hotelId: string, roomTypeId: string) {
  return useQuery({
    queryKey: hotelPropertyKeys.beds(hotelId, roomTypeId),
    queryFn: () => hotelPropertyService.getBeds(hotelId, roomTypeId),
    enabled: !!hotelId && !!roomTypeId,
  });
}
