import { useMutation, useQueryClient } from '@tanstack/react-query';
import { hotelManagementService } from '@/services/hotel-management.service';
import { queryKeys } from '@/constants/queryKeys';
import { hotelManagementKeys } from './keys';

/** DELETE /:hotelId/room-types/:roomTypeId — xoá loại phòng (chỉ khi chưa có phòng/booking). */
export function useDeleteRoomType(hotelId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (roomTypeId: string) => hotelManagementService.deleteRoomType(hotelId, roomTypeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: hotelManagementKeys.roomTypes(hotelId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.hotels.managed(hotelId) });
    },
  });
}
