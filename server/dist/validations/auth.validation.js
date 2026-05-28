"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyEmail = exports.resetPassword = exports.forgotPassword = exports.refreshTokens = exports.logout = exports.login = exports.sendOtp = exports.register = void 0;
const joi_1 = __importDefault(require("joi"));
const custom_validation_1 = require("./custom.validation");
exports.register = {
    body: joi_1.default.object().keys({
        email: joi_1.default.string().required().email(),
        password: joi_1.default.string().required().custom(custom_validation_1.password),
        name: joi_1.default.string().required(),
        verificationCode: joi_1.default.string().required().length(6),
        phone: joi_1.default.string().allow('', null),
        avatarUrl: joi_1.default.string().uri().allow('', null),
        dateOfBirth: joi_1.default.string().isoDate().allow('', null),
        nationality: joi_1.default.string().allow('', null),
        idCardNumber: joi_1.default.string().allow('', null),
        passportNumber: joi_1.default.string().allow('', null),
        preferredLanguage: joi_1.default.string().valid('vi', 'en').default('vi'),
        preferredCurrency: joi_1.default.string().valid('VND', 'USD').default('VND'),
        marketingOptIn: joi_1.default.boolean().default(false),
    }),
};
exports.sendOtp = {
    body: joi_1.default.object().keys({
        email: joi_1.default.string().required().email(),
    }),
};
exports.login = {
    body: joi_1.default.object().keys({
        email: joi_1.default.string().required(),
        password: joi_1.default.string().required(),
    }),
};
exports.logout = {
    body: joi_1.default.object().keys({
        refreshToken: joi_1.default.string().required(),
    }),
};
exports.refreshTokens = {
    body: joi_1.default.object().keys({
        refreshToken: joi_1.default.string().required(),
    }),
};
exports.forgotPassword = {
    body: joi_1.default.object().keys({
        email: joi_1.default.string().email().required(),
    }),
};
exports.resetPassword = {
    query: joi_1.default.object().keys({
        token: joi_1.default.string().required(),
    }),
    body: joi_1.default.object().keys({
        password: joi_1.default.string().required().custom(custom_validation_1.password),
    }),
};
exports.verifyEmail = {
    query: joi_1.default.object().keys({
        token: joi_1.default.string().required(),
    }),
};
