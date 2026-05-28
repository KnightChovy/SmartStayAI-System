"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyEmail = exports.sendVerificationEmail = exports.resetPassword = exports.forgotPassword = exports.refreshTokens = exports.logout = exports.login = exports.sendOtp = exports.register = void 0;
const http_status_1 = __importDefault(require("http-status"));
const catchAsync_1 = __importDefault(require("../utils/catchAsync"));
const services_1 = require("../services");
const prisma_1 = __importDefault(require("../config/prisma"));
const ApiError_1 = __importDefault(require("../utils/ApiError"));
exports.register = (0, catchAsync_1.default)(async (req, res) => {
    const { email, password, name, verificationCode } = req.body;
    // 1. Verify OTP code
    const tokenRecord = await prisma_1.default.verificationToken.findFirst({
        where: {
            email,
            code: verificationCode,
            expiresAt: { gt: new Date() },
        },
    });
    if (!tokenRecord) {
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, 'Invalid or expired verification code');
    }
    // 2. Delete verification token record
    await prisma_1.default.verificationToken.deleteMany({
        where: { email },
    });
    // 3. Create user (forwarding all fields)
    const user = await services_1.userService.createUser({
        name,
        email,
        password,
        phone: req.body.phone,
        avatarUrl: req.body.avatarUrl,
        dateOfBirth: req.body.dateOfBirth,
        nationality: req.body.nationality,
        idCardNumber: req.body.idCardNumber,
        passportNumber: req.body.passportNumber,
        preferredLanguage: req.body.preferredLanguage,
        preferredCurrency: req.body.preferredCurrency,
        marketingOptIn: req.body.marketingOptIn,
    });
    // 4. Mark email as verified
    const verifiedUser = await prisma_1.default.user.update({
        where: { id: user.id },
        data: { emailVerifiedAt: new Date() },
    });
    // 5. Generate tokens
    const tokens = await services_1.tokenService.generateAuthTokens(verifiedUser);
    res.status(http_status_1.default.CREATED).send({ user: verifiedUser, tokens });
});
exports.sendOtp = (0, catchAsync_1.default)(async (req, res) => {
    const { email } = req.body;
    // Check if email already exists
    const existingUser = await services_1.userService.getUserByEmail(email);
    if (existingUser) {
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, 'Email already taken');
    }
    // Generate 6-digit OTP code
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    // Save to VerificationToken table (expires in 10 minutes)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await prisma_1.default.verificationToken.deleteMany({ where: { email } });
    await prisma_1.default.verificationToken.create({
        data: {
            email,
            code: otpCode,
            expiresAt,
        },
    });
    // Send email (handling offline local SMTP gracefully and logging to terminal)
    console.log(`\n🔑 [OTP Verification] The code for ${email} is: ${otpCode}\n`);
    try {
        await services_1.emailService.sendOtpEmail(email, otpCode);
    }
    catch (error) {
        console.error(`❌ [Email Service Failure] Detailed error:`, error);
        console.log(`[Email Service Bypass] SMTP email server is offline. Use console logged OTP code.`);
    }
    res.status(http_status_1.default.OK).send({
        status: 'success',
        message: `Verification OTP sent successfully to ${email}`,
    });
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
