import { useMutation, useQueryClient } from '@tanstack/react-query';
import { staffService } from '@/services/staff.service';
import type { CheckInPayload } from '@/types/staff.types';
import { staffKeys } from './keys';

/** Check in a guest at the front desk. */
export function useCheckIn(hotelId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ bookingId, payload }: { bookingId: string; payload?: CheckInPayload }) =>
      staffService.checkIn(hotelId as string, bookingId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: staffKeys.all });
    },
  });
}
