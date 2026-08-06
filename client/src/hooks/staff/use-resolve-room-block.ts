import { useMutation, useQueryClient } from '@tanstack/react-query';
import { staffService } from '@/services/staff.service';
import { staffKeys } from './keys';

/**
 * Gỡ một đợt chặn (`DELETE /hotels/:id/rooms/:roomId/blocks/:blockId`).
 *
 * ⚠️ Gỡ là kết thúc **cả đợt**, không phải gỡ riêng một ngày: BE set `resolvedAt = now` và trả
 * phòng về kho bán cho mọi ngày còn lại của đợt. UI phải nói rõ khoảng ngày trước khi bấm.
 */
export function useResolveRoomBlock(hotelId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ roomId, blockId }: { roomId: string; blockId: string }) =>
      staffService.resolveRoomBlock(hotelId as string, roomId, blockId),
    onSuccess: () => qc.invalidateQueries({ queryKey: staffKeys.all }),
  });
}
