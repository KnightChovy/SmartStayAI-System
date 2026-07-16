import express from 'express';
import auth from '../../middlewares/auth';
import validate from '../../middlewares/validate';
import { notificationValidation } from '../../validations';
import { notificationController } from '../../controllers';

const router = express.Router();

// Toàn bộ endpoint thông báo đều theo người dùng đang đăng nhập (auth() = mọi user hợp lệ)

// Danh sách thông báo của chính mình (phân trang, lọc loại / chưa đọc)
router.get('/', auth(), validate(notificationValidation.getMyNotifications), notificationController.getMyNotifications);

// Số thông báo chưa đọc (badge) — literal, đặt TRƯỚC '/:notificationId' để không bị nuốt
router.get('/unread-count', auth(), notificationController.getUnreadCount);

// Đánh dấu tất cả là đã đọc — literal, đặt TRƯỚC '/:notificationId'
router.post('/read-all', auth(), notificationController.markAllAsRead);

// Đánh dấu một thông báo là đã đọc
router.patch(
  '/:notificationId/read',
  auth(),
  validate(notificationValidation.notificationId),
  notificationController.markAsRead
);

// Xoá một thông báo của chính mình
router.delete(
  '/:notificationId',
  auth(),
  validate(notificationValidation.notificationId),
  notificationController.deleteNotification
);

export default router;
