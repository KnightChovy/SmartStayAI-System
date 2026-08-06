import { useMutation, useQueryClient } from '@tanstack/react-query';
import { staffService } from '@/services/staff.service';
import { staffKeys } from './keys';
import { queryKeys } from '@/constants/queryKeys';

/** Record a cash payment for a pay-at-hotel booking. */
export function useRecordCashPayment(hotelId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ bookingId }: { bookingId: string }) =>
      staffService.recordCashPayment(hotelId as string, bookingId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: staffKeys.all });
      qc.invalidateQueries({ queryKey: queryKeys.bookings.all });
    },
  });
}
