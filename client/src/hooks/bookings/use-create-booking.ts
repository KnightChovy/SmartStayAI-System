import { useMutation, useQueryClient } from '@tanstack/react-query';
import { bookingService } from '@/services/booking.service';
import { queryKeys } from '@/constants/queryKeys';
import type { CreateBookingPayload } from '@/types/booking.types';

/** Tạo booking mới. */
export function useCreateBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateBookingPayload) => bookingService.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.bookings.all });
    },
  });
}
