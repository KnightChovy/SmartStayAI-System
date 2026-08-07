import { useMutation, useQueryClient } from '@tanstack/react-query';
import { staffService } from '@/services/staff.service';
import { staffKeys } from './keys';

/**
 * Gỡ phòng đã gán trước (`DELETE /hotels/:id/bookings/:bookingId/assign-room`).
 *
 * ⚠️ Chỉ dùng cho đơn còn `confirmed`. Khách đã check-in thì đây KHÔNG phải đường trả phòng —
 * BE trả 400 và bắt đi qua Front desk.
 */
export function useReleaseAssignedRoom(hotelId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ bookingId }: { bookingId: string }) =>
      staffService.releaseAssignedRoom(hotelId as string, bookingId),
    onSuccess: () => qc.invalidateQueries({ queryKey: staffKeys.all }),
  });
}
