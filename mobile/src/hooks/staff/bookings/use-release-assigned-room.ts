import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/constants/queryKeys';
import { staffService } from '@/services/staff.service';

/** `DELETE /hotels/:hotelId/bookings/:bookingId/assign-room` — gỡ phòng đã gán trước. */
export function useReleaseAssignedRoom(hotelId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (bookingId: string) => staffService.releaseAssignedRoom(hotelId, bookingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.staff.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all() });
    },
  });
}
