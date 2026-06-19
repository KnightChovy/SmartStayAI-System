import { useMutation, useQueryClient } from '@tanstack/react-query';
import { staffService } from '@/services/staff.service';
import { staffKeys } from './keys';

/** Hoàn thành (1-tap) một task dọn phòng → phòng trở lại available. */
export function useCompleteHousekeeping(hotelId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId }: { taskId: string }) =>
      staffService.completeHousekeeping(hotelId as string, taskId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: staffKeys.all });
    },
  });
}
