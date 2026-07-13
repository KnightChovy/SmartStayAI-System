import Joi from 'joi';
import { password } from './custom.validation';

export const register = {
  body: Joi.object().keys({
    email: Joi.string().required().email(),
    password: Joi.string().required().custom(password),
    name: Joi.string().required(),
    verificationCode: Joi.string().required().length(6),
    phone: Joi.string().allow('', null),
    avatarUrl: Joi.string().uri().allow('', null),
    dateOfBirth: Joi.string().isoDate().allow('', null),
    nationality: Joi.string().allow('', null),
    idCardNumber: Joi.string().allow('', null),
    passportNumber: Joi.string().allow('', null),
    preferredLanguage: Joi.string().valid('vi', 'en').default('vi'),
    preferredCurrency: Joi.string().valid('VND', 'USD').default('VND'),
    marketingOptIn: Joi.boolean().default(false),
  }),
};

// Đăng ký tài khoản đối tác (hotel_partner): giống register nhưng chỉ 4 field cốt lõi
export const registerPartner = {
  body: Joi.object().keys({
    email: Joi.string().required().email(),
    password: Joi.string().required().custom(password),
    name: Joi.string().required(),
    verificationCode: Joi.string().required().length(6),
  }),
};

export const sendOtp = {
  body: Joi.object().keys({
    email: Joi.string().required().email(),
  }),
};

export const login = {
  body: Joi.object().keys({
    email: Joi.string().required(),
    password: Joi.string().required(),
  }),
};

export const logout = {
  body: Joi.object().keys({
    refreshToken: Joi.string().required(),
  }),
};

export const refreshTokens = {
  body: Joi.object().keys({
    refreshToken: Joi.string().required(),
  }),
};

export const forgotPassword = {
  body: Joi.object().keys({
    email: Joi.string().email().required(),
  }),
};

export const resetPassword = {
  query: Joi.object().keys({
    token: Joi.string().required(),
  }),
  body: Joi.object().keys({
    password: Joi.string().required().custom(password),
  }),
};

export const verifyEmail = {
  query: Joi.object().keys({
    token: Joi.string().required(),
  }),
};
