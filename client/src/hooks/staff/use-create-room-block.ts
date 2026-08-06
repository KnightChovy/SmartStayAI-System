import { useMutation, useQueryClient } from '@tanstack/react-query';
import { staffService } from '@/services/staff.service';
import type { CreateRoomBlockPayload } from '@/types/staff.types';
import { staffKeys } from './keys';

/**
 * Chặn một phòng theo khoảng ngày (`POST /hotels/:id/rooms/:roomId/blocks`).
 *
 * Đây là cách đổi tình trạng phòng **theo ngày**. Lối cũ (`PATCH .../status` của Room map) không có
 * chiều thời gian: bấm "Maintenance" là BE tự chặn 7 ngày kể từ hôm nay, bấm "Available" là gỡ sạch
 * mọi đợt chặn đang có — đổi một lần là đổi cho mọi ngày.
 */
export function useCreateRoomBlock(hotelId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      roomId,
      payload,
    }: {
      roomId: string;
      payload: CreateRoomBlockPayload;
    }) => staffService.createRoomBlock(hotelId as string, roomId, payload),
    // Đụng tới cả tồn kho lẫn bản đồ phòng ⇒ làm mới cả nhánh staff.
    onSuccess: () => qc.invalidateQueries({ queryKey: staffKeys.all }),
  });
}
