import httpStatus from 'http-status';
import { Request, Response } from 'express';
import type { User } from '@prisma/client';
import pick from '../utils/pick';
import catchAsync from '../utils/catchAsync';
import { notificationService } from '../services';

export class NotificationController {
  // Danh sách thông báo của chính người dùng đang đăng nhập (phân trang, lọc loại / chưa đọc)
  getMyNotifications = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const filter = pick(req.query, ['unreadOnly', 'type']);
    const options = pick(req.query, ['sortBy', 'limit', 'page']);
    const result = await notificationService.getMyNotifications(req.user as User, filter, options);
    res.send(result);
  });

  // Số thông báo chưa đọc (badge)
  getUnreadCount = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const result = await notificationService.getUnreadCount(req.user as User);
    res.send(result);
  });

  // Đánh dấu một thông báo là đã đọc
  markAsRead = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const notification = await notificationService.markAsRead(req.user as User, req.params.notificationId as string);
    res.send(notification);
  });

  // Đánh dấu tất cả thông báo là đã đọc
  markAllAsRead = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const result = await notificationService.markAllAsRead(req.user as User);
    res.send(result);
  });

  // Xoá một thông báo của chính mình
  deleteNotification = catchAsync(async (req: Request, res: Response): Promise<void> => {
    await notificationService.deleteNotification(req.user as User, req.params.notificationId as string);
    res.status(httpStatus.NO_CONTENT).send();
  });
}

export const notificationController = new NotificationController();
