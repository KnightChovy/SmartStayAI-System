import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/constants/queryKeys';
import { bookingsService } from '@/services/bookings.service';
import type { CreateBookingPayload } from '@/types/bookings.type';

/** `POST /bookings` — tạo booking mới rồi làm mới danh sách booking của tôi. */
export function useCreateBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateBookingPayload) => bookingsService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all() });
    },
  });
}
