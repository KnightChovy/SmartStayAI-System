import { useMutation, useQueryClient } from '@tanstack/react-query';
import { hotelManagementService } from '@/services/hotel-management.service';
import type { AddRoomTypeImagesDto } from '@/types/hotel-management.types';
import { hotelManagementKeys } from './keys';

/** POST /:hotelId/room-types/:roomTypeId/images — thêm ảnh cho loại phòng. */
export function useAddRoomTypeImages(hotelId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ roomTypeId, dto }: { roomTypeId: string; dto: AddRoomTypeImagesDto }) =>
      hotelManagementService.addRoomTypeImages(hotelId, roomTypeId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: hotelManagementKeys.roomTypes(hotelId) });
    },
  });
}
