import Joi from 'joi';

const notificationTypes = [
  'booking_confirmed',
  'payment_success',
  'check_in_reminder',
  'review_request',
  'alert',
  'promotion',
  'partner_approved',
];

// Danh sách thông báo của chính người dùng (phân trang + lọc)
export const getMyNotifications = {
  query: Joi.object().keys({
    unreadOnly: Joi.boolean(),
    type: Joi.string().valid(...notificationTypes),
    sortBy: Joi.string(),
    limit: Joi.number().integer().min(1).max(100),
    page: Joi.number().integer().min(1),
  }),
};

// Thao tác trên một thông báo theo id (đọc / xoá)
export const notificationId = {
  params: Joi.object().keys({
    notificationId: Joi.string().uuid().required(),
  }),
};
