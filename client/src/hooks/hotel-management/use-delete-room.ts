import { useMutation, useQueryClient } from '@tanstack/react-query';
import { hotelManagementService } from '@/services/hotel-management.service';
import { hotelManagementKeys } from './keys';

/** DELETE /:hotelId/rooms/:roomId — xoá phòng vật lý (chỉ khi phòng chưa từng được đặt). */
export function useDeleteRoom(hotelId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (roomId: string) => hotelManagementService.deleteRoom(hotelId, roomId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...hotelManagementKeys.all, 'rooms', hotelId],
      });
    },
  });
}
