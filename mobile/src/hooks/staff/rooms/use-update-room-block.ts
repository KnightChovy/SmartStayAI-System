import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/constants/queryKeys';
import { staffService } from '@/services/staff.service';
import type { UpdateRoomBlockPayload } from '@/types/staff.type';

/** `PATCH /hotels/:hotelId/rooms/:roomId/blocks/:blockId` — gia hạn/rút ngắn đợt chặn. */
export function useUpdateRoomBlock(hotelId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      roomId,
      blockId,
      payload,
    }: {
      roomId: string;
      blockId: string;
      payload: UpdateRoomBlockPayload;
    }) => staffService.updateRoomBlock(hotelId, roomId, blockId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.staff.all() });
    },
  });
}
