import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/constants/queryKeys';
import { staffService } from '@/services/staff.service';
import type { CreateRoomBlockPayload } from '@/types/staff.type';

/** `POST /hotels/:hotelId/rooms/:roomId/blocks` — tạo đợt chặn phòng khẩn cấp. */
export function useCreateRoomBlock(hotelId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ roomId, payload }: { roomId: string; payload: CreateRoomBlockPayload }) =>
      staffService.createRoomBlock(hotelId, roomId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.staff.all() });
    },
  });
}
