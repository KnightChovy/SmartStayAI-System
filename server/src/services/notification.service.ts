import httpStatus from 'http-status';
import type { Prisma, User } from '@prisma/client';
import prisma from '../config/prisma';
import ApiError from '../utils/ApiError';
import type { NotificationFilter, NotificationQueryOptions } from '../dto/notification.dto';

export class NotificationService {
  /** Tìm thông báo thuộc CHÍNH người dùng, 404 nếu không có (chặn xem/sửa thông báo của người khác). */
  private getOwnedNotification = async (userId: string, notificationId: string) => {
    const notification = await prisma.notification.findFirst({ where: { id: notificationId, userId } });
    if (!notification) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Notification not found');
    }
    return notification;
  };

  /**
   * Danh sách thông báo của CHÍNH người dùng đang đăng nhập, mới nhất trước. Lọc theo loại và
   * theo trạng thái chưa đọc (unreadOnly). Kèm số lượng chưa đọc để client hiển thị badge mà
   * không cần gọi thêm endpoint đếm.
   */
  getMyNotifications = async (
    currentUser: User,
    filter: NotificationFilter,
    options: NotificationQueryOptions
  ) => {
    const limit = options.limit || 20;
    const page = options.page || 1;
    const skip = (page - 1) * limit;

    const where: Prisma.NotificationWhereInput = { userId: currentUser.id };
    if (filter.type) {
      where.type = filter.type;
    }
    if (filter.unreadOnly) {
      where.readAt = null;
    }

    let orderBy: Prisma.NotificationOrderByWithRelationInput = { createdAt: 'desc' };
    if (options.sortBy) {
      const [field, direction] = options.sortBy.split(':');
      orderBy = { [field]: direction === 'desc' ? 'desc' : 'asc' };
    }

    const [results, totalResults, unreadCount] = await prisma.$transaction([
      prisma.notification.findMany({ where, skip, take: limit, orderBy }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { userId: currentUser.id, readAt: null } }),
    ]);

    return { results, page, limit, totalPages: Math.ceil(totalResults / limit), totalResults, unreadCount };
  };

  /** Số thông báo chưa đọc của người dùng — dùng riêng cho badge trên thanh điều hướng. */
  getUnreadCount = async (currentUser: User) => {
    const unreadCount = await prisma.notification.count({ where: { userId: currentUser.id, readAt: null } });
    return { unreadCount };
  };

  /**
   * Đánh dấu MỘT thông báo là đã đọc. Chỉ chủ thông báo mới thao tác được. Đã đọc rồi thì giữ
   * nguyên readAt cũ (idempotent, không dời lại mốc thời gian đọc).
   */
  markAsRead = async (currentUser: User, notificationId: string) => {
    const notification = await this.getOwnedNotification(currentUser.id, notificationId);
    if (notification.readAt) {
      return notification;
    }
    return prisma.notification.update({
      where: { id: notificationId },
      data: { readAt: new Date(), status: 'read' },
    });
  };

  /** Đánh dấu TẤT CẢ thông báo chưa đọc là đã đọc. Trả về số dòng vừa cập nhật. */
  markAllAsRead = async (currentUser: User) => {
    const { count } = await prisma.notification.updateMany({
      where: { userId: currentUser.id, readAt: null },
      data: { readAt: new Date(), status: 'read' },
    });
    return { updated: count };
  };

  /** Xoá MỘT thông báo của chính người dùng (kiểm quyền sở hữu trước khi xoá). */
  deleteNotification = async (currentUser: User, notificationId: string) => {
    await this.getOwnedNotification(currentUser.id, notificationId);
    await prisma.notification.delete({ where: { id: notificationId } });
  };
}

export const notificationService = new NotificationService();
