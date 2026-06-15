import { useMutation, useQueryClient } from '@tanstack/react-query';
import { bookingService } from '@/services/booking.service';
import { queryKeys } from '@/constants/queryKeys';

/** Hủy booking. */
export function useCancelBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ bookingId, reason }: { bookingId: string; reason?: string }) =>
      bookingService.cancel(bookingId, reason),
    onSuccess: booking => {
      qc.invalidateQueries({ queryKey: queryKeys.bookings.all });
      qc.setQueryData(queryKeys.bookings.detail(booking.id), booking);
    },
  });
}
