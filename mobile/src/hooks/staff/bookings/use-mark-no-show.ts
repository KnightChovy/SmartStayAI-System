import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/constants/queryKeys';
import { staffService } from '@/services/staff.service';

/** `POST /hotels/:hotelId/bookings/:bookingId/no-show` — đánh dấu khách không đến. */
export function useMarkNoShow(hotelId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (bookingId: string) => staffService.markNoShow(hotelId, bookingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.staff.all() });
    },
  });
}
