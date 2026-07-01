import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/constants/queryKeys';
import { staffService } from '@/services/staff.service';
import type { CheckOutPayload } from '@/types/staff.type';

/** `POST /hotels/:hotelId/bookings/:bookingId/check-out` — trả phòng + xuất hoá đơn. */
export function useCheckOut(hotelId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ bookingId, payload }: { bookingId: string; payload?: CheckOutPayload }) =>
      staffService.checkOut(hotelId, bookingId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.staff.all() });
    },
  });
}
