import { useMutation, useQueryClient } from '@tanstack/react-query';
import { staffService } from '@/services/staff.service';
import type { HkStatus } from '@/types/staff.types';
import { staffKeys } from './keys';

/**
 * Đổi trạng thái buồng phòng (`PATCH /hotels/:id/rooms/:roomId/housekeeping`).
 *
 * Chiều DUY NHẤT staff được bấm trực tiếp — và là trạng thái của **lúc này**, không gắn ngày.
 */
export function useUpdateHousekeeping(hotelId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ roomId, hkStatus }: { roomId: string; hkStatus: HkStatus }) =>
      staffService.updateHousekeeping(hotelId as string, roomId, hkStatus),
    onSuccess: () => qc.invalidateQueries({ queryKey: staffKeys.all }),
  });
}
