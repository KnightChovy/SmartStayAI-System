import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/constants/queryKeys';
import { staffService } from '@/services/staff.service';
import type { AssignRoomPayload } from '@/types/staff.type';

/** `POST /hotels/:hotelId/bookings/:bookingId/assign-room` — chốt trước phòng vật lý. */
export function useAssignRoom(hotelId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ bookingId, payload }: { bookingId: string; payload: AssignRoomPayload }) =>
      staffService.assignRoom(hotelId, bookingId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.staff.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all() });
    },
  });
}
