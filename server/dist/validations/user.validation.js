"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUser = exports.updateUser = exports.getUser = exports.getUsers = exports.createUser = void 0;
const joi_1 = __importDefault(require("joi"));
const custom_validation_1 = require("./custom.validation");
exports.createUser = {
    body: joi_1.default.object().keys({
        email: joi_1.default.string().required().email(),
        password: joi_1.default.string().required().custom(custom_validation_1.password),
        name: joi_1.default.string().required(),
        role: joi_1.default.string().required().valid('guest', 'customer', 'staff', 'marketer', 'hotel_partner', 'platform_manager', 'admin'),
    }),
};
exports.getUsers = {
    query: joi_1.default.object().keys({
        name: joi_1.default.string(),
        role: joi_1.default.string(),
        sortBy: joi_1.default.string(),
        limit: joi_1.default.number().integer(),
        page: joi_1.default.number().integer(),
    }),
};
exports.getUser = {
    params: joi_1.default.object().keys({
        userId: joi_1.default.string().uuid(),
    }),
};
exports.updateUser = {
    params: joi_1.default.object().keys({
        userId: joi_1.default.string().uuid().required(),
    }),
    body: joi_1.default.object()
        .keys({
        email: joi_1.default.string().email(),
        password: joi_1.default.string().custom(custom_validation_1.password),
        name: joi_1.default.string(),
    })
        .min(1),
};
exports.deleteUser = {
    params: joi_1.default.object().keys({
        userId: joi_1.default.string().uuid(),
    }),
};
