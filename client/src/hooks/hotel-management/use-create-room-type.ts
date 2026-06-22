import { useMutation, useQueryClient } from '@tanstack/react-query';
import { hotelManagementService } from '@/services/hotel-management.service';
import type { CreateRoomTypeDto } from '@/types/hotel-management.types';
import { hotelManagementKeys } from './keys';

/** POST /:hotelId/room-types — tạo loại phòng. */
export function useCreateRoomType(hotelId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateRoomTypeDto) =>
      hotelManagementService.createRoomType(hotelId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: hotelManagementKeys.roomTypes(hotelId) });
    },
  });
}
