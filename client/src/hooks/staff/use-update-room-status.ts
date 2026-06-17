import { useMutation, useQueryClient } from '@tanstack/react-query';
import { staffService } from '@/services/staff.service';
import type { RoomStatus } from '@/types/staff.types';
import { staffKeys } from './keys';

/** Đổi nhanh trạng thái một phòng (available / occupied / cleaning / maintenance). */
export function useUpdateRoomStatus(hotelId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ roomId, status }: { roomId: string; status: RoomStatus }) =>
      staffService.updateRoomStatus(hotelId as string, roomId, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: staffKeys.all });
    },
  });
}
