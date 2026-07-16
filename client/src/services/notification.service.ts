import { api } from '@/lib/api';
import type {
  AppNotification,
  MarkAllReadResponse,
  NotificationsParams,
  NotificationsResponse,
  UnreadCountResponse,
} from '@/types/account.types';

/**
 * Thông báo của người dùng đang đăng nhập (`/v1/notifications`).
 * Mọi endpoint đều yêu cầu đăng nhập (`auth()`); quyền sở hữu do BE kiểm ở tầng service —
 * thao tác lên thông báo của người khác trả **404** (không phải 403) để không lộ sự tồn tại.
 *
 * ⚠️ BE KHÔNG đẩy thông báo qua socket (không có room theo user) ⇒ đây là luồng **pull**,
 * badge chưa đọc phải tự poll/refetch.
 */

/** Bỏ các field undefined/rỗng để query string gọn gàng. */
function cleanParams<T extends object>(params: T): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
  );
}

export const notificationService = {
  /** Danh sách thông báo của chính mình (`GET /notifications`) — phân trang, kèm `unreadCount`. */
  async list(params: NotificationsParams = {}): Promise<NotificationsResponse> {
    const { data } = await api.get<NotificationsResponse>('/notifications', {
      params: cleanParams(params),
    });
    return data;
  },

  /** Số thông báo chưa đọc cho badge (`GET /notifications/unread-count`). */
  async getUnreadCount(): Promise<UnreadCountResponse> {
    const { data } = await api.get<UnreadCountResponse>('/notifications/unread-count');
    return data;
  },

  /**
   * Đánh dấu một thông báo đã đọc (`PATCH /notifications/:id/read`).
   * Idempotent ở BE: đã đọc rồi thì giữ nguyên `readAt` cũ, không dời mốc.
   */
  async markRead(notificationId: string): Promise<AppNotification> {
    const { data } = await api.patch<AppNotification>(`/notifications/${notificationId}/read`);
    return data;
  },

  /** Đánh dấu tất cả đã đọc (`POST /notifications/read-all`). Trả `{ updated }`. */
  async markAllRead(): Promise<MarkAllReadResponse> {
    const { data } = await api.post<MarkAllReadResponse>('/notifications/read-all');
    return data;
  },

  /** Xoá một thông báo của chính mình (`DELETE /notifications/:id`) — 204, không có body. */
  async remove(notificationId: string): Promise<void> {
    await api.delete(`/notifications/${notificationId}`);
  },
};
