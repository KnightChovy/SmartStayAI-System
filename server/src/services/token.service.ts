import jwt from 'jsonwebtoken';
import moment from 'moment';
import httpStatus from 'http-status';
import type { User } from '@prisma/client';
import config from '../config/config';
import { userService } from './user.service';
import prisma from '../config/prisma';
import ApiError from '../utils/ApiError';
import hashToken from '../utils/hashToken';
import { tokenTypes } from '../config/tokens';

export interface TokenDoc {
  id: string;
  token: string;
  userId: string;
  expires: Date;
  type: string;
}

export interface AuthTokens {
  access: { token: string; expires: Date };
  refresh: { token: string; expires: Date };
}

export class TokenService {
  /**
   * Generate token
   * @param {string} userId
   * @param {moment.Moment} expires
   * @param {string} type
   * @param {string} [secret]
   * @returns {string}
   */
  generateToken = (userId: string, expires: moment.Moment, type: string, secret: string = config.jwt.secret): string => {
    const payload = {
      sub: userId,
      iat: moment().unix(),
      exp: expires.unix(),
      type,
    };
    return jwt.sign(payload, secret);
  };

  /**
   * Save a token (hashed at rest)
   * @param {string} token
   * @param {string} userId
   * @param {moment.Moment} expires
   * @param {string} type
   * @returns {Promise<void>}
   */
  saveToken = async (token: string, userId: string, expires: moment.Moment, type: string): Promise<void> => {
    const tokenHash = hashToken(token);

    if (type === tokenTypes.REFRESH) {
      await prisma.userSession.create({
        data: {
          userId,
          refreshTokenHash: tokenHash,
          expiresAt: expires.toDate(),
        },
      });
      return;
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

      await prisma.verificationToken.create({
        data: {
          email: user.email,
          code: tokenHash,
          expiresAt: expires.toDate(),
        },
      });
      return;
    }

    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid token type');
  };

  /**
   * Verify token and return token doc (or throw an error if it is not valid)
   * @param {string} token
   * @param {string} type
   * @returns {Promise<TokenDoc>}
   */
  verifyToken = async (token: string, type: string): Promise<TokenDoc> => {
    const payload = jwt.verify(token, config.jwt.secret) as jwt.JwtPayload;
    const userId = payload.sub as string;
    const tokenHash = hashToken(token);

    if (type === tokenTypes.REFRESH) {
      const session = await prisma.userSession.findFirst({
        where: {
          refreshTokenHash: tokenHash,
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
          code: tokenHash,
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
   * @param {Pick<User, 'id'>} user
   * @returns {Promise<AuthTokens>}
   */
  generateAuthTokens = async (user: Pick<User, 'id'>): Promise<AuthTokens> => {
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
  generateResetPasswordToken = async (email: string): Promise<string> => {
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
   * @param {Pick<User, 'id'>} user
   * @returns {Promise<string>}
   */
  generateVerifyEmailToken = async (user: Pick<User, 'id'>): Promise<string> => {
    const expires = moment().add(config.jwt.verifyEmailExpirationMinutes, 'minutes');
    const verifyEmailToken = this.generateToken(user.id, expires, tokenTypes.VERIFY_EMAIL);
    await this.saveToken(verifyEmailToken, user.id, expires, tokenTypes.VERIFY_EMAIL);
    return verifyEmailToken;
  };
}

export const tokenService = new TokenService();
