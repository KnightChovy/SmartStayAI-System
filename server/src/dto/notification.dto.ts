import type { NotificationType } from '@prisma/client';

/** Bộ lọc khi liệt kê thông báo của CHÍNH người dùng đang đăng nhập. */
export interface NotificationFilter {
  // Chỉ lấy thông báo chưa đọc (readAt = null) — dùng cho tab "Chưa đọc".
  unreadOnly?: boolean;
  // Lọc theo loại thông báo (booking_confirmed, payment_success, ...).
  type?: NotificationType;
}

/** Tuỳ chọn phân trang / sắp xếp khi liệt kê thông báo. */
export interface NotificationQueryOptions {
  limit?: number;
  page?: number;
  sortBy?: string;
}
