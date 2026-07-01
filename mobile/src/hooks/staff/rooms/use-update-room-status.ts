import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/constants/queryKeys';
import { staffService } from '@/services/staff.service';
import type { RoomStatusUpdatable } from '@/types/staff.type';

/** `PATCH /hotels/:hotelId/rooms/:roomId/status` — đổi nhanh trạng thái phòng. */
export function useUpdateRoomStatus(hotelId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ roomId, status }: { roomId: string; status: RoomStatusUpdatable }) =>
      staffService.updateRoomStatus(hotelId, roomId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.staff.all() });
    },
  });
}
