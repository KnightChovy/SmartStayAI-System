import { useMutation, useQueryClient } from '@tanstack/react-query';
import { staffService } from '@/services/staff.service';
import type { CheckOutPayload } from '@/types/staff.types';
import { staffKeys } from './keys';
import { queryKeys } from '@/constants/queryKeys';

/** Check out a guest (optionally with an extra charge). The backend creates a housekeeping task automatically. */
export function useCheckOut(hotelId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ bookingId, payload }: { bookingId: string; payload?: CheckOutPayload }) =>
      staffService.checkOut(hotelId as string, bookingId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: staffKeys.all });
      qc.invalidateQueries({ queryKey: queryKeys.bookings.all });
    },
  });
}
