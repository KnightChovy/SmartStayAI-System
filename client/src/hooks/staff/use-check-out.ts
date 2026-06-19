import { useMutation, useQueryClient } from '@tanstack/react-query';
import { staffService } from '@/services/staff.service';
import type { CheckOutPayload } from '@/types/staff.types';
import { staffKeys } from './keys';

/** Check-out khách (có thể kèm phụ phí). Backend tự sinh task dọn phòng. */
export function useCheckOut(hotelId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ bookingId, payload }: { bookingId: string; payload?: CheckOutPayload }) =>
      staffService.checkOut(hotelId as string, bookingId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: staffKeys.all });
    },
  });
}
