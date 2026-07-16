import { useQuery } from '@tanstack/react-query';
import { notificationService } from '@/services/notification.service';
import { queryKeys } from '@/constants/queryKeys';
import type { NotificationsParams } from '@/types/account.types';

/**
 * Danh sách thông báo của chính mình (`GET /notifications`).
 *
 * Response kèm sẵn `unreadCount` (tổng chưa đọc, BE tính bỏ qua bộ lọc) nên chuông
 * không cần gọi thêm `/unread-count` — một request là đủ cho cả danh sách lẫn badge.
 *
 * Endpoint yêu cầu đăng nhập; mọi nơi đang dùng đều đã ở sau cổng auth (chuông chỉ
 * render khi `isAuthenticated`, trang `/account` có route guard).
 */
export function useNotifications(params: NotificationsParams = {}) {
  return useQuery({
    queryKey: queryKeys.notifications.list(params),
    queryFn: () => notificationService.list(params),
  });
}
