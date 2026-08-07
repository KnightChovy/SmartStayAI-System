import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/constants/queryKeys';
import { staffService } from '@/services/staff.service';

/** `DELETE /hotels/:hotelId/rooms/:roomId/blocks/:blockId` — đóng đợt chặn (soft resolve). */
export function useResolveRoomBlock(hotelId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ roomId, blockId }: { roomId: string; blockId: string }) =>
      staffService.resolveRoomBlock(hotelId, roomId, blockId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.staff.all() });
    },
  });
}
