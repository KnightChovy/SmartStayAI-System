import jwt from 'jsonwebtoken';
import moment from 'moment';
import httpStatus from 'http-status';
import config from '../config/config';
import { userService } from './user.service';
import prisma from '../config/prisma';
import ApiError from '../utils/ApiError';
import { tokenTypes } from '../config/tokens';

export class TokenService {
  /**
   * Generate token
   * @param {string} userId
   * @param {moment.Moment} expires
   * @param {string} type
   * @param {string} [secret]
   * @returns {string}
   */
  generateToken = (userId: string, expires: moment.Moment, type: string, secret = config.jwt.secret) => {
    const payload = {
      sub: userId,
      iat: moment().unix(),
      exp: expires.unix(),
      type,
    };
    return jwt.sign(payload, secret);
  };

  /**
   * Save a token
   * @param {string} token
   * @param {string} userId
   * @param {moment.Moment} expires
   * @param {string} type
   * @param {boolean} [blacklisted]
   * @returns {Promise<any>}
   */
  saveToken = async (
    token: string,
    userId: string,
    expires: moment.Moment,
    type: string,
    blacklisted = false
  ) => {
    if (type === tokenTypes.REFRESH) {
      return prisma.userSession.create({
        data: {
          userId,
          refreshTokenHash: token,
          expiresAt: expires.toDate(),
        },
      });
    }

    if (type === tokenTypes.RESET_PASSWORD || type === tokenTypes.VERIFY_EMAIL) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
      }

      // Clean up any existing verification tokens for this email to avoid duplicates
      await prisma.verificationToken.deleteMany({
        where: { email: user.email },
      });

      return prisma.verificationToken.create({
        data: {
          email: user.email,
          code: token,
          expiresAt: expires.toDate(),
        },
      });
    }

    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid token type');
  };

  /**
   * Verify token and return token doc (or throw an error if it is not valid)
   * @param {string} token
   * @param {string} type
   * @returns {Promise<any>}
   */
  verifyToken = async (token: string, type: string) => {
    const payload = jwt.verify(token, config.jwt.secret) as any;
    const userId = payload.sub;

    if (type === tokenTypes.REFRESH) {
      const session = await prisma.userSession.findFirst({
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

    if (type === tokenTypes.RESET_PASSWORD || type === tokenTypes.VERIFY_EMAIL) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        throw new Error('User not found');
      }

      const verificationToken = await prisma.verificationToken.findFirst({
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

  /**
   * Generate auth tokens
   * @param {any} user
   * @returns {Promise<any>}
   */
  generateAuthTokens = async (user: any) => {
    const accessTokenExpires = moment().add(config.jwt.accessExpirationMinutes, 'minutes');
    const accessToken = this.generateToken(user.id, accessTokenExpires, tokenTypes.ACCESS);

    const refreshTokenExpires = moment().add(config.jwt.refreshExpirationDays, 'days');
    const refreshToken = this.generateToken(user.id, refreshTokenExpires, tokenTypes.REFRESH);
    await this.saveToken(refreshToken, user.id, refreshTokenExpires, tokenTypes.REFRESH);

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

  /**
   * Generate reset password token
   * @param {string} email
   * @returns {Promise<string>}
   */
  generateResetPasswordToken = async (email: string) => {
    const user = await userService.getUserByEmail(email);
    if (!user) {
      throw new ApiError(httpStatus.NOT_FOUND, 'No users found with this email');
    }
    const expires = moment().add(config.jwt.resetPasswordExpirationMinutes, 'minutes');
    const resetPasswordToken = this.generateToken(user.id, expires, tokenTypes.RESET_PASSWORD);
    await this.saveToken(resetPasswordToken, user.id, expires, tokenTypes.RESET_PASSWORD);
    return resetPasswordToken;
  };

  /**
   * Generate verify email token
   * @param {any} user
   * @returns {Promise<string>}
   */
  generateVerifyEmailToken = async (user: any) => {
    const expires = moment().add(config.jwt.verifyEmailExpirationMinutes, 'minutes');
    const verifyEmailToken = this.generateToken(user.id, expires, tokenTypes.VERIFY_EMAIL);
    await this.saveToken(verifyEmailToken, user.id, expires, tokenTypes.VERIFY_EMAIL);
    return verifyEmailToken;
  };
}

export const tokenService = new TokenService();
