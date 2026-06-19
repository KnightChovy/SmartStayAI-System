import { useMutation, useQueryClient } from '@tanstack/react-query';
import { staffService } from '@/services/staff.service';
import { staffKeys } from './keys';

/** Thu tiền mặt cho booking trả tại khách sạn. */
export function useRecordCashPayment(hotelId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ bookingId }: { bookingId: string }) =>
      staffService.recordCashPayment(hotelId as string, bookingId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: staffKeys.all });
    },
  });
}
