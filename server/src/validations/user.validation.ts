import Joi from 'joi';
import { password } from './custom.validation';

export const createUser = {
  body: Joi.object().keys({
    email: Joi.string().required().email(),
    password: Joi.string().required().custom(password),
    name: Joi.string().required(),
    role: Joi.string().required().valid('guest', 'customer', 'staff', 'marketer', 'hotel_partner', 'platform_manager', 'admin'),
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
      .valid('guest', 'customer', 'staff', 'marketer', 'hotel_partner', 'platform_manager', 'admin'),
  }),
};
