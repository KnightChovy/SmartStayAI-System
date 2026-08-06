import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/constants/queryKeys';
import { staffService } from '@/services/staff.service';
import type { CheckInPayload } from '@/types/staff.type';

/** `POST /hotels/:hotelId/bookings/:bookingId/check-in` — nhận phòng. */
export function useCheckIn(hotelId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ bookingId, payload }: { bookingId: string; payload?: CheckInPayload }) =>
      staffService.checkIn(hotelId, bookingId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.staff.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all() });
    },
  });
}
