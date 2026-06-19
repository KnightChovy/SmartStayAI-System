import { useMutation, useQueryClient } from '@tanstack/react-query';
import { hotelManagementService } from '@/services/hotel-management.service';
import type { UpdateRoomDto } from '@/types/hotel-management.types';
import { hotelManagementKeys } from './keys';

/** PUT /:hotelId/rooms/:roomId — cập nhật phòng. */
export function useUpdateRoom(hotelId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ roomId, dto }: { roomId: string; dto: UpdateRoomDto }) =>
      hotelManagementService.updateRoom(hotelId, roomId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...hotelManagementKeys.all, 'rooms', hotelId] });
    },
  });
}
