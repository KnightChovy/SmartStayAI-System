import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationService } from '@/services/notification.service';
import { queryKeys } from '@/constants/queryKeys';

/**
 * Xoá một thông báo của chính mình (`DELETE /notifications/:id`).
 * BE trả 204 (không body) và chặn xoá thông báo của người khác bằng 404.
 */
export function useDeleteNotification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.notifications.all }),
  });
}
