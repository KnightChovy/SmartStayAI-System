import { useMutation, useQueryClient } from '@tanstack/react-query';
import { hotelPropertyKeys } from '@/hooks/hotel-property/keys';
import { hotelPropertyService } from '@/services/hotel-property.service';
import type { SetRoomBedsDto } from '@/types/hotel-property.types';

/** `PUT /hotels/:id/room-types/:roomTypeId/beds` — thay thế toàn bộ cấu hình giường. */
export function useSetRoomBeds(hotelId: string, roomTypeId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: SetRoomBedsDto) =>
      hotelPropertyService.setBeds(hotelId, roomTypeId, dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: hotelPropertyKeys.beds(hotelId, roomTypeId) });
    },
  });
}
