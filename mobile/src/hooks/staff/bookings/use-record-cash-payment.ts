import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/constants/queryKeys';
import { staffService } from '@/services/staff.service';

/** `POST /hotels/:hotelId/bookings/:bookingId/record-cash-payment` — thu tiền mặt. */
export function useRecordCashPayment(hotelId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (bookingId: string) => staffService.recordCashPayment(hotelId, bookingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.staff.all() });
    },
  });
}
