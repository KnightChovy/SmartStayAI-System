import Joi from 'joi';
import { password } from './custom.validation';

export const createUser = {
  body: Joi.object().keys({
    email: Joi.string().required().email(),
    password: Joi.string().required().custom(password),
    name: Joi.string().required(),
    role: Joi.string().required().valid('guest', 'customer', 'staff', 'hotel_partner', 'platform_manager', 'admin'),
  }),
};

export const getUsers = {
  query: Joi.object().keys({
    name: Joi.string(),
    role: Joi.string(),
    status: Joi.string().valid('active', 'inactive', 'suspended'),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

export const getUser = {
  params: Joi.object().keys({
    userId: Joi.string().uuid(),
  }),
};

export const updateUser = {
  params: Joi.object().keys({
    userId: Joi.string().uuid().required(),
  }),
  body: Joi.object()
    .keys({
      email: Joi.string().email(),
      password: Joi.string().custom(password),
      name: Joi.string(),
    })
    .min(1),
};

export const deleteUser = {
  params: Joi.object().keys({
    userId: Joi.string().uuid(),
  }),
};

// User tự cập nhật hồ sơ (self-service) — không nhận email/role/status
export const updateMyProfile = {
  body: Joi.object()
    .keys({
      fullName: Joi.string().max(255),
      phone: Joi.string().max(20).allow('', null),
      avatarUrl: Joi.string().uri().allow('', null),
      dateOfBirth: Joi.date().iso().allow(null),
      nationality: Joi.string().max(100).allow('', null),
      idCardNumber: Joi.string().max(50).allow('', null),
      passportNumber: Joi.string().max(50).allow('', null),
      preferredLanguage: Joi.string().valid('vi', 'en'),
      preferredCurrency: Joi.string().valid('VND', 'USD'),
      marketingOptIn: Joi.boolean(),
    })
    .min(1),
};

// User tự đổi mật khẩu — cần mật khẩu hiện tại + mật khẩu mới hợp lệ
export const changeMyPassword = {
  body: Joi.object().keys({
    currentPassword: Joi.string().required(),
    newPassword: Joi.string().required().custom(password),
  }),
};

// [Admin] Đổi trạng thái tài khoản (suspend/active/inactive)
export const updateUserStatus = {
  params: Joi.object().keys({
    userId: Joi.string().uuid().required(),
  }),
  body: Joi.object().keys({
    status: Joi.string().required().valid('active', 'inactive', 'suspended'),
  }),
};

// [Admin, manageRoles] Đổi vai trò 1 user
export const updateUserRole = {
  params: Joi.object().keys({
    userId: Joi.string().uuid().required(),
  }),
  body: Joi.object().keys({
    role: Joi.string()
      .required()
      .valid('guest', 'customer', 'staff', 'hotel_partner', 'platform_manager', 'admin'),
  }),
};
