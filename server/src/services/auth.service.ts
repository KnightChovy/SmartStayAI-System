import httpStatus from 'http-status';
import bcrypt from 'bcryptjs';
import { tokenService } from './token.service';
import { userService } from './user.service';
import { emailService } from './email.service';
import prisma from '../config/prisma';
import ApiError from '../utils/ApiError';
import { tokenTypes } from '../config/tokens';

export class AuthService {
  /**
   * Login with username and password
   * @param {string} email
   * @param {string} password
   * @returns {Promise<any>}
   */
  loginUserWithEmailAndPassword = async (email: string, password: string) => {
    const user = await userService.getUserByEmail(email);
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'Incorrect email or password');
    }
    return user;
  };

  /**
   * Logout
   * @param {string} refreshToken
   * @returns {Promise<void>}
   */
  logout = async (refreshToken: string) => {
    const session = await prisma.userSession.findFirst({
      where: {
        refreshTokenHash: refreshToken,
        revokedAt: null,
      },
    });
    if (!session) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Not found');
    }
    await prisma.userSession.delete({
      where: { id: session.id },
    });
  };

  /**
   * Refresh auth tokens
   * @param {string} refreshToken
   * @returns {Promise<any>}
   */
  refreshAuth = async (refreshToken: string) => {
    try {
      const refreshTokenDoc = await tokenService.verifyToken(refreshToken, tokenTypes.REFRESH);
      const user = await userService.getUserById(refreshTokenDoc.userId);
      if (!user) {
        throw new Error();
      }
      await prisma.userSession.delete({
        where: { id: refreshTokenDoc.id },
      });
      return tokenService.generateAuthTokens(user);
    } catch (error) {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate');
    }
  };

  /**
   * Reset password
   * @param {string} resetPasswordToken
   * @param {string} newPassword
   * @returns {Promise<void>}
   */
  resetPassword = async (resetPasswordToken: string, newPassword: string) => {
    try {
      const resetPasswordTokenDoc = await tokenService.verifyToken(resetPasswordToken, tokenTypes.RESET_PASSWORD);
      const user = await userService.getUserById(resetPasswordTokenDoc.userId);
      if (!user) {
        throw new Error();
      }
      const hashedPassword = await bcrypt.hash(newPassword, 8);
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
  verifyEmail = async (verifyEmailToken: string) => {
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
   * Register a user after verifying OTP code
   * @param {any} userBody
   * @param {string} verificationCode
   * @returns {Promise<any>}
   */
  registerUser = async (userBody: any, verificationCode: string) => {
    // 1. Verify OTP code
    const tokenRecord = await prisma.verificationToken.findFirst({
      where: {
        email: userBody.email,
        code: verificationCode,
        expiresAt: { gt: new Date() },
      },
    });

    if (!tokenRecord) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid or expired verification code');
    }

    // 2. Delete verification token record
    await prisma.verificationToken.deleteMany({
      where: { email: userBody.email },
    });

    // 3. Create user (forwarding all fields)
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
    });

    // 4. Mark email as verified
    const verifiedUser = await prisma.user.update({
      where: { id: user.id },
      data: { emailVerifiedAt: new Date() },
    });

    // 5. Generate tokens
    const tokens = await tokenService.generateAuthTokens(verifiedUser);
    return { user: verifiedUser, tokens };
  };

  /**
   * Generate OTP and send it via email
   * @param {string} email
   * @returns {Promise<void>}
   */
  generateAndSendOtp = async (email: string) => {
    // Check if email already exists
    const existingUser = await userService.getUserByEmail(email);
    if (existingUser) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
    }

    // Generate 6-digit OTP code
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Save to VerificationToken table (expires in 10 minutes)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.verificationToken.deleteMany({ where: { email } });
    await prisma.verificationToken.create({
      data: {
        email,
        code: otpCode,
        expiresAt,
      },
    });

    // Send email (handling offline local SMTP gracefully and logging to terminal)
    console.log(`\n[OTP Verification] The code for ${email} is: ${otpCode}\n`);
    try {
      await emailService.sendOtpEmail(email, otpCode);
    } catch (error) {
      console.error(`[Email Service Failure] Detailed error:`, error);
      console.log(`[Email Service Bypass] SMTP email server is offline. Use console logged OTP code.`);
    }
  };
}

export const authService = new AuthService();
