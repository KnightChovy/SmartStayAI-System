import { useMutation, useQueryClient } from '@tanstack/react-query';
import { staffService } from '@/services/staff.service';
import type { UpdateRoomBlockPayload } from '@/types/staff.types';
import { staffKeys } from './keys';

/**
 * Gia hạn / rút ngắn / sửa lý do một đợt chặn đang mở
 * (`PATCH /hotels/:id/rooms/:roomId/blocks/:blockId`).
 *
 * Khác `useResolveRoomBlock` (kết thúc CẢ đợt và trả phòng về kho bán): ở đây đợt chặn vẫn còn, chỉ
 * đổi ngày dự kiến xong. Dùng cái này thay cho "gỡ rồi tạo lại" để giữ nguyên lịch sử chi phí sự cố.
 */
export function useUpdateRoomBlock(hotelId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      roomId,
      blockId,
      payload,
    }: {
      roomId: string;
      blockId: string;
      payload: UpdateRoomBlockPayload;
    }) => staffService.updateRoomBlock(hotelId as string, roomId, blockId, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: staffKeys.all }),
  });
}
