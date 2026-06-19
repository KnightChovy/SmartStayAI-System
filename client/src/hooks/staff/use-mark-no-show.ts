import { useMutation, useQueryClient } from '@tanstack/react-query';
import { staffService } from '@/services/staff.service';
import { staffKeys } from './keys';

/** Đánh dấu khách không đến nhận phòng (no-show). */
export function useMarkNoShow(hotelId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ bookingId }: { bookingId: string }) =>
      staffService.markNoShow(hotelId as string, bookingId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: staffKeys.all });
    },
  });
}
