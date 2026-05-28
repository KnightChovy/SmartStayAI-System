"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyEmail = exports.sendVerificationEmail = exports.resetPassword = exports.forgotPassword = exports.refreshTokens = exports.logout = exports.login = exports.register = void 0;
const http_status_1 = __importDefault(require("http-status"));
const catchAsync_1 = __importDefault(require("../utils/catchAsync"));
const services_1 = require("../services");
exports.register = (0, catchAsync_1.default)(async (req, res) => {
    const user = await services_1.userService.createUser(req.body);
    const tokens = await services_1.tokenService.generateAuthTokens(user);
    res.status(http_status_1.default.CREATED).send({ user, tokens });
});
exports.login = (0, catchAsync_1.default)(async (req, res) => {
    const { email, password } = req.body;
    const user = await services_1.authService.loginUserWithEmailAndPassword(email, password);
    const tokens = await services_1.tokenService.generateAuthTokens(user);
    res.send({ user, tokens });
});
exports.logout = (0, catchAsync_1.default)(async (req, res) => {
    await services_1.authService.logout(req.body.refreshToken);
    res.status(http_status_1.default.NO_CONTENT).send();
});
exports.refreshTokens = (0, catchAsync_1.default)(async (req, res) => {
    const tokens = await services_1.authService.refreshAuth(req.body.refreshToken);
    res.send({ ...tokens });
});
exports.forgotPassword = (0, catchAsync_1.default)(async (req, res) => {
    const resetPasswordToken = await services_1.tokenService.generateResetPasswordToken(req.body.email);
    await services_1.emailService.sendResetPasswordEmail(req.body.email, resetPasswordToken);
    res.status(http_status_1.default.NO_CONTENT).send();
});
exports.resetPassword = (0, catchAsync_1.default)(async (req, res) => {
    await services_1.authService.resetPassword(req.query.token, req.body.password);
    res.status(http_status_1.default.NO_CONTENT).send();
});
exports.sendVerificationEmail = (0, catchAsync_1.default)(async (req, res) => {
    const verifyEmailToken = await services_1.tokenService.generateVerifyEmailToken(req.user);
    await services_1.emailService.sendVerificationEmail(req.user.email, verifyEmailToken);
    res.status(http_status_1.default.NO_CONTENT).send();
});
exports.verifyEmail = (0, catchAsync_1.default)(async (req, res) => {
    await services_1.authService.verifyEmail(req.query.token);
    res.status(http_status_1.default.NO_CONTENT).send();
});
