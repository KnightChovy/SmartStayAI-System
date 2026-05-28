"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateVerifyEmailToken = exports.generateResetPasswordToken = exports.generateAuthTokens = exports.verifyToken = exports.saveToken = exports.generateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const moment_1 = __importDefault(require("moment"));
const http_status_1 = __importDefault(require("http-status"));
const config_1 = __importDefault(require("../config/config"));
const userService = __importStar(require("./user.service"));
const prisma_1 = __importDefault(require("../config/prisma"));
const ApiError_1 = __importDefault(require("../utils/ApiError"));
const tokens_1 = require("../config/tokens");
/**
 * Generate token
 * @param {string} userId
 * @param {moment.Moment} expires
 * @param {string} type
 * @param {string} [secret]
 * @returns {string}
 */
const generateToken = (userId, expires, type, secret = config_1.default.jwt.secret) => {
    const payload = {
        sub: userId,
        iat: (0, moment_1.default)().unix(),
        exp: expires.unix(),
        type,
    };
    return jsonwebtoken_1.default.sign(payload, secret);
};
exports.generateToken = generateToken;
/**
 * Save a token
 * @param {string} token
 * @param {string} userId
 * @param {moment.Moment} expires
 * @param {string} type
 * @param {boolean} [blacklisted]
 * @returns {Promise<any>}
 */
const saveToken = async (token, userId, expires, type, blacklisted = false) => {
    if (type === tokens_1.tokenTypes.REFRESH) {
        return prisma_1.default.userSession.create({
            data: {
                userId,
                refreshTokenHash: token,
                expiresAt: expires.toDate(),
            },
        });
    }
    if (type === tokens_1.tokenTypes.RESET_PASSWORD || type === tokens_1.tokenTypes.VERIFY_EMAIL) {
        const user = await prisma_1.default.user.findUnique({ where: { id: userId } });
        if (!user) {
            throw new ApiError_1.default(http_status_1.default.NOT_FOUND, 'User not found');
        }
        // Clean up any existing verification tokens for this email to avoid duplicates
        await prisma_1.default.verificationToken.deleteMany({
            where: { email: user.email },
        });
        return prisma_1.default.verificationToken.create({
            data: {
                email: user.email,
                code: token,
                expiresAt: expires.toDate(),
            },
        });
    }
    throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, 'Invalid token type');
};
exports.saveToken = saveToken;
/**
 * Verify token and return token doc (or throw an error if it is not valid)
 * @param {string} token
 * @param {string} type
 * @returns {Promise<any>}
 */
const verifyToken = async (token, type) => {
    const payload = jsonwebtoken_1.default.verify(token, config_1.default.jwt.secret);
    const userId = payload.sub;
    if (type === tokens_1.tokenTypes.REFRESH) {
        const session = await prisma_1.default.userSession.findFirst({
            where: {
                refreshTokenHash: token,
                userId,
                expiresAt: { gt: new Date() },
                revokedAt: null,
            },
        });
        if (!session) {
            throw new Error('Token not found');
        }
        return {
            id: session.id,
            token: session.refreshTokenHash,
            userId: session.userId,
            expires: session.expiresAt,
            type,
        };
    }
    if (type === tokens_1.tokenTypes.RESET_PASSWORD || type === tokens_1.tokenTypes.VERIFY_EMAIL) {
        const user = await prisma_1.default.user.findUnique({ where: { id: userId } });
        if (!user) {
            throw new Error('User not found');
        }
        const verificationToken = await prisma_1.default.verificationToken.findFirst({
            where: {
                email: user.email,
                code: token,
                expiresAt: { gt: new Date() },
            },
        });
        if (!verificationToken) {
            throw new Error('Token not found');
        }
        return {
            id: verificationToken.id,
            token: verificationToken.code,
            userId: user.id,
            expires: verificationToken.expiresAt,
            type,
        };
    }
    throw new Error('Invalid token type');
};
exports.verifyToken = verifyToken;
/**
 * Generate auth tokens
 * @param {any} user
 * @returns {Promise<any>}
 */
const generateAuthTokens = async (user) => {
    const accessTokenExpires = (0, moment_1.default)().add(config_1.default.jwt.accessExpirationMinutes, 'minutes');
    const accessToken = (0, exports.generateToken)(user.id, accessTokenExpires, tokens_1.tokenTypes.ACCESS);
    const refreshTokenExpires = (0, moment_1.default)().add(config_1.default.jwt.refreshExpirationDays, 'days');
    const refreshToken = (0, exports.generateToken)(user.id, refreshTokenExpires, tokens_1.tokenTypes.REFRESH);
    await (0, exports.saveToken)(refreshToken, user.id, refreshTokenExpires, tokens_1.tokenTypes.REFRESH);
    return {
        access: {
            token: accessToken,
            expires: accessTokenExpires.toDate(),
        },
        refresh: {
            token: refreshToken,
            expires: refreshTokenExpires.toDate(),
        },
    };
};
exports.generateAuthTokens = generateAuthTokens;
/**
 * Generate reset password token
 * @param {string} email
 * @returns {Promise<string>}
 */
const generateResetPasswordToken = async (email) => {
    const user = await userService.getUserByEmail(email);
    if (!user) {
        throw new ApiError_1.default(http_status_1.default.NOT_FOUND, 'No users found with this email');
    }
    const expires = (0, moment_1.default)().add(config_1.default.jwt.resetPasswordExpirationMinutes, 'minutes');
    const resetPasswordToken = (0, exports.generateToken)(user.id, expires, tokens_1.tokenTypes.RESET_PASSWORD);
    await (0, exports.saveToken)(resetPasswordToken, user.id, expires, tokens_1.tokenTypes.RESET_PASSWORD);
    return resetPasswordToken;
};
exports.generateResetPasswordToken = generateResetPasswordToken;
/**
 * Generate verify email token
 * @param {any} user
 * @returns {Promise<string>}
 */
const generateVerifyEmailToken = async (user) => {
    const expires = (0, moment_1.default)().add(config_1.default.jwt.verifyEmailExpirationMinutes, 'minutes');
    const verifyEmailToken = (0, exports.generateToken)(user.id, expires, tokens_1.tokenTypes.VERIFY_EMAIL);
    await (0, exports.saveToken)(verifyEmailToken, user.id, expires, tokens_1.tokenTypes.VERIFY_EMAIL);
    return verifyEmailToken;
};
exports.generateVerifyEmailToken = generateVerifyEmailToken;
