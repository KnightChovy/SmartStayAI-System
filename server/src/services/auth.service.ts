import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import httpStatus from 'http-status';
import bcrypt from 'bcryptjs';
import type { User, UserRole } from '@prisma/client';
import { tokenService, AuthTokens } from './token.service';
import { userService } from './user.service';
import type { CreateUserDto } from '../dto/user.dto';
import { emailService } from './email.service';
import prisma from '../config/prisma';
import config from '../config/config';
import logger from '../config/logger';
import ApiError from '../utils/ApiError';
import hashToken from '../utils/hashToken';
import sanitizeUser from '../utils/sanitizeUser';
import { tokenTypes } from '../config/tokens';

export interface RegisterUserDto extends CreateUserDto {
  verificationCode: string;
}

const OTP_EXPIRATION_MS = 10 * 60 * 1000;
const MAX_OTP_ATTEMPTS = 5;

export class AuthService {
  /**
   * Login with email and password
   * @param {string} email
   * @param {string} password
   * @returns {Promise<User>}
   */
  loginUserWithEmailAndPassword = async (email: string, password: string): Promise<User> => {
    const user = await userService.getUserByEmail(email);
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'Incorrect email or password');
    }
    if (user.status !== 'active') {
      throw new ApiError(httpStatus.FORBIDDEN, 'Account is inactive or suspended');
    }
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });
    return user;
  };

  /**
   * Logout by revoking the matching refresh session
   * @param {string} refreshToken
   * @returns {Promise<void>}
   */
  logout = async (refreshToken: string): Promise<void> => {
    const session = await prisma.userSession.findFirst({
      where: {
        refreshTokenHash: hashToken(refreshToken),
        revokedAt: null,
      },
    });
    if (!session) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Not found');
    }
    // Revoke (soft) instead of deleting so a replayed token is still recognisable as reuse.
    await prisma.userSession.update({
      where: { id: session.id },
      data: { revokedAt: new Date() },
    });
  };

  /**
   * Refresh auth tokens (rotates the refresh session)
   * @param {string} refreshToken
   * @returns {Promise<AuthTokens>}
   */
  refreshAuth = async (refreshToken: string): Promise<AuthTokens> => {
    // An invalid or expired JWT signature is simply unauthorized.
    let userId: string;
    try {
      const payload = jwt.verify(refreshToken, config.jwt.secret) as jwt.JwtPayload;
      userId = payload.sub as string;
    } catch (error) {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate');
    }

    const session = await prisma.userSession.findFirst({
      where: { refreshTokenHash: hashToken(refreshToken), userId },
    });

    // Reuse detection: a token whose session was already rotated/revoked is being
    // replayed -> treat as theft and revoke every active session of this user.
    if (session?.revokedAt) {
      await prisma.userSession.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      throw new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate');
    }

    if (!session || session.expiresAt <= new Date()) {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate');
    }

    const user = await userService.getUserById(userId);
    if (!user) {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate');
    }

    // Rotate: revoke the used session and issue a fresh token pair.
    await prisma.userSession.update({
      where: { id: session.id },
      data: { revokedAt: new Date() },
    });
    return tokenService.generateAuthTokens(user);
  };

  /**
   * Send a reset-password email. Always resolves without revealing whether the
   * email exists (prevents user enumeration).
   * @param {string} email
   * @returns {Promise<void>}
   */
  forgotPassword = async (email: string): Promise<void> => {
    const user = await userService.getUserByEmail(email);
    if (!user) {
      return;
    }
    const resetPasswordToken = await tokenService.generateResetPasswordToken(email);
    try {
      await emailService.sendResetPasswordEmail(email, resetPasswordToken);
    } catch (error) {
      logger.error('[Email Service Failure] Unable to send reset-password email', error);
    }
  };

  /**
   * Reset password
   * @param {string} resetPasswordToken
   * @param {string} newPassword
   * @returns {Promise<void>}
   */
  resetPassword = async (resetPasswordToken: string, newPassword: string): Promise<void> => {
    try {
      const resetPasswordTokenDoc = await tokenService.verifyToken(resetPasswordToken, tokenTypes.RESET_PASSWORD);
      const user = await userService.getUserById(resetPasswordTokenDoc.userId);
      if (!user) {
        throw new Error();
      }
      const hashedPassword = await bcrypt.hash(newPassword, config.bcrypt.rounds);
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: hashedPassword },
      });
      await prisma.verificationToken.deleteMany({
        where: { email: user.email },
      });
    } catch (error) {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'Password reset failed');
    }
  };

  /**
   * Verify email
   * @param {string} verifyEmailToken
   * @returns {Promise<void>}
   */
  verifyEmail = async (verifyEmailToken: string): Promise<void> => {
    try {
      const verifyEmailTokenDoc = await tokenService.verifyToken(verifyEmailToken, tokenTypes.VERIFY_EMAIL);
      const user = await userService.getUserById(verifyEmailTokenDoc.userId);
      if (!user) {
        throw new Error();
      }
      await prisma.verificationToken.deleteMany({
        where: { email: user.email },
      });
      await prisma.user.update({
        where: { id: user.id },
        data: { emailVerifiedAt: new Date() },
      });
    } catch (error) {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'Email verification failed');
    }
  };

  /**
   * Register a user after verifying the OTP code
   * @param {RegisterUserDto} userBody
   * @param {string} verificationCode
   * @param {UserRole} role - Vai trò tài khoản tạo ra (mặc định 'customer'; 'hotel_partner' cho luồng đăng ký đối tác)
   * @returns {Promise<{ user: Omit<User, 'passwordHash'>; tokens: AuthTokens }>}
   */
  registerUser = async (userBody: RegisterUserDto, verificationCode: string, role: UserRole = 'customer') => {
    // 1. Find the (non-expired) OTP record for this email
    const otpRecord = await prisma.verificationToken.findFirst({
      where: {
        email: userBody.email,
        expiresAt: { gt: new Date() },
      },
    });

    if (!otpRecord) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid or expired verification code');
    }

    // 2. Wrong code: count the attempt and lock the OTP after too many tries
    if (otpRecord.code !== hashToken(verificationCode)) {
      if (otpRecord.attempts + 1 >= MAX_OTP_ATTEMPTS) {
        await prisma.verificationToken.delete({ where: { id: otpRecord.id } });
        throw new ApiError(httpStatus.BAD_REQUEST, 'Too many invalid attempts. Please request a new code.');
      }
      await prisma.verificationToken.update({
        where: { id: otpRecord.id },
        data: { attempts: { increment: 1 } },
      });
      throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid or expired verification code');
    }

    // 3. Correct code: consume the OTP record
    await prisma.verificationToken.deleteMany({
      where: { email: userBody.email },
    });

    // 4. Create user (forwarding all fields)
    const user = await userService.createUser({
      name: userBody.name,
      email: userBody.email,
      password: userBody.password,
      phone: userBody.phone,
      avatarUrl: userBody.avatarUrl,
      dateOfBirth: userBody.dateOfBirth,
      nationality: userBody.nationality,
      idCardNumber: userBody.idCardNumber,
      passportNumber: userBody.passportNumber,
      preferredLanguage: userBody.preferredLanguage,
      preferredCurrency: userBody.preferredCurrency,
      marketingOptIn: userBody.marketingOptIn,
      role,
    });

    // 5. Mark email as verified
    const verifiedUser = await prisma.user.update({
      where: { id: user.id },
      data: { emailVerifiedAt: new Date() },
    });

    // 6. Generate tokens
    const tokens = await tokenService.generateAuthTokens(verifiedUser);
    return { user: sanitizeUser(verifiedUser), tokens };
  };

  /**
   * Generate an OTP and send it via email (stored hashed)
   * @param {string} email
   * @returns {Promise<void>}
   */
  generateAndSendOtp = async (email: string): Promise<void> => {
    // Check if email already exists
    const existingUser = await userService.getUserByEmail(email);
    if (existingUser) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
    }

    // Generate a cryptographically-secure 6-digit OTP code
    const otpCode = crypto.randomInt(100000, 1000000).toString();
    const expiresAt = new Date(Date.now() + OTP_EXPIRATION_MS);

    await prisma.verificationToken.deleteMany({ where: { email } });
    await prisma.verificationToken.create({
      data: {
        email,
        code: hashToken(otpCode),
        expiresAt,
      },
    });

    // In non-production, surface the OTP in logs so local testing works without SMTP
    if (config.env !== 'production') {
      logger.info(`[OTP Verification] The code for ${email} is: ${otpCode}`);
    }

    try {
      await emailService.sendOtpEmail(email, otpCode);
    } catch (error) {
      logger.error('[Email Service Failure] Unable to send OTP email', error);
      if (config.env !== 'production') {
        logger.warn('[Email Service Bypass] SMTP offline. Use the console-logged OTP code.');
      }
    }
  };
}

export const authService = new AuthService();
