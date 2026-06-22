import { useMutation, useQueryClient } from '@tanstack/react-query';
import { hotelManagementService } from '@/services/hotel-management.service';
import type { UpdateRoomTypeDto } from '@/types/hotel-management.types';
import { hotelManagementKeys } from './keys';

/** PUT /:hotelId/room-types/:roomTypeId — cập nhật loại phòng. */
export function useUpdateRoomType(hotelId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ roomTypeId, dto }: { roomTypeId: string; dto: UpdateRoomTypeDto }) =>
      hotelManagementService.updateRoomType(hotelId, roomTypeId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: hotelManagementKeys.roomTypes(hotelId) });
    },
  });
}
