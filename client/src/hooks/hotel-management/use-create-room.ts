import { useMutation, useQueryClient } from '@tanstack/react-query';
import { hotelManagementService } from '@/services/hotel-management.service';
import type { CreateRoomDto } from '@/types/hotel-management.types';
import { hotelManagementKeys } from './keys';

/** POST /:hotelId/rooms — tạo phòng vật lý. */
export function useCreateRoom(hotelId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateRoomDto) => hotelManagementService.createRoom(hotelId, dto),
    onSuccess: () => {
      // Phòng mới ảnh hưởng cả list phòng và _count.rooms của loại phòng.
      queryClient.invalidateQueries({ queryKey: [...hotelManagementKeys.all, 'rooms', hotelId] });
      queryClient.invalidateQueries({ queryKey: hotelManagementKeys.roomTypes(hotelId) });
    },
  });
}
