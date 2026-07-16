import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationService } from '@/services/notification.service';
import { queryKeys } from '@/constants/queryKeys';

/**
 * Đánh dấu MỘT thông báo đã đọc (`PATCH /notifications/:id/read`).
 *
 * BE chỉ trả về đúng thông báo vừa cập nhật (không trả lại cả danh sách), mà badge
 * `unreadCount` do server tính ⇒ phải invalidate cả nhánh `notifications` thay vì
 * `setQueryData` như hồi còn mock (mock trả nguyên mảng nên ghi thẳng được).
 */
export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationService.markRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.notifications.all }),
  });
}
