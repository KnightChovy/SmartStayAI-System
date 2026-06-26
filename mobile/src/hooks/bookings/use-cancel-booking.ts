import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/constants/queryKeys';
import { bookingsService } from '@/services/bookings.service';

interface CancelBookingArgs {
  bookingId: string;
  reason?: string;
}

/** `PATCH /bookings/:bookingId/cancel` — huỷ booking rồi làm mới cache liên quan. */
export function useCancelBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ bookingId, reason }: CancelBookingArgs) =>
      bookingsService.cancel(bookingId, reason),
    onSuccess: (booking) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all() });
      queryClient.setQueryData(queryKeys.bookings.detail(booking.id), booking);
    },
  });
}
