import Joi from 'joi';
import { password } from './custom.validation';

// Chủ KS tạo + gán nhân viên vào khách sạn
export const addStaff = {
  params: Joi.object().keys({
    hotelId: Joi.string().uuid().required(),
  }),
  body: Joi.object().keys({
    name: Joi.string().required(),
    email: Joi.string().email().required(),
    password: Joi.string().required().custom(password),
    phone: Joi.string().allow('', null),
    assignedRole: Joi.string().valid('staff').default('staff'),
  }),
};

// Danh sách nhân viên của khách sạn
export const listStaff = {
  params: Joi.object().keys({
    hotelId: Joi.string().uuid().required(),
  }),
};

// Chi tiết một nhân viên của khách sạn
export const getStaff = {
  params: Joi.object().keys({
    hotelId: Joi.string().uuid().required(),
    userId: Joi.string().uuid().required(),
  }),
};

// Bỏ gán một nhân viên khỏi khách sạn
export const removeStaff = {
  params: Joi.object().keys({
    hotelId: Joi.string().uuid().required(),
    userId: Joi.string().uuid().required(),
  }),
};
