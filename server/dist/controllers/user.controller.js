"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUser = exports.updateUser = exports.getUser = exports.getUsers = exports.createUser = void 0;
const http_status_1 = __importDefault(require("http-status"));
const pick_1 = __importDefault(require("../utils/pick"));
const ApiError_1 = __importDefault(require("../utils/ApiError"));
const catchAsync_1 = __importDefault(require("../utils/catchAsync"));
const services_1 = require("../services");
exports.createUser = (0, catchAsync_1.default)(async (req, res) => {
    const user = await services_1.userService.createUser(req.body);
    res.status(http_status_1.default.CREATED).send(user);
});
exports.getUsers = (0, catchAsync_1.default)(async (req, res) => {
    const filter = (0, pick_1.default)(req.query, ['name', 'role']);
    const options = (0, pick_1.default)(req.query, ['sortBy', 'limit', 'page']);
    const result = await services_1.userService.queryUsers(filter, options);
    res.send(result);
});
exports.getUser = (0, catchAsync_1.default)(async (req, res) => {
    const user = await services_1.userService.getUserById(req.params.userId);
    if (!user) {
        throw new ApiError_1.default(http_status_1.default.NOT_FOUND, 'User not found');
    }
    res.send(user);
});
exports.updateUser = (0, catchAsync_1.default)(async (req, res) => {
    const user = await services_1.userService.updateUserById(req.params.userId, req.body);
    res.send(user);
});
exports.deleteUser = (0, catchAsync_1.default)(async (req, res) => {
    await services_1.userService.deleteUserById(req.params.userId);
    res.status(http_status_1.default.NO_CONTENT).send();
});
