import httpStatus from 'http-status';
import bcrypt from 'bcryptjs';
import type { Prisma, User, UserRole } from '@prisma/client';
import prisma from '../config/prisma';
import config from '../config/config';
import ApiError from '../utils/ApiError';

export interface CreateUserDto {
  name: string;
  email: string;
  password: string;
  phone?: string | null;
  avatarUrl?: string | null;
  role?: UserRole;
  dateOfBirth?: string | null;
  nationality?: string | null;
  idCardNumber?: string | null;
  passportNumber?: string | null;
  preferredLanguage?: 'vi' | 'en';
  preferredCurrency?: 'VND' | 'USD';
  marketingOptIn?: boolean;
}

export interface UpdateUserDto {
  name?: string;
  email?: string;
  password?: string;
}

export interface UserFilter {
  name?: string;
  role?: UserRole;
}

export interface UserQueryOptions {
  limit?: number;
  page?: number;
  sortBy?: string;
}

export class UserService {
  /**
   * Get an active (non-deleted) user by email
   * @param {string} email
   * @returns {Promise<User | null>}
   */
  getUserByEmail = async (email: string): Promise<User | null> => {
    return prisma.user.findFirst({ where: { email, deletedAt: null } });
  };

  /**
   * Get an active (non-deleted) user by id
   * @param {string} id
   * @returns {Promise<User | null>}
   */
  getUserById = async (id: string): Promise<User | null> => {
    return prisma.user.findFirst({ where: { id, deletedAt: null } });
  };

  /**
   * Create a user
   * @param {CreateUserDto} userBody
   * @returns {Promise<User>}
   */
  createUser = async (userBody: CreateUserDto): Promise<User> => {
    const existingUser = await this.getUserByEmail(userBody.email);
    if (existingUser) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
    }

    const hashedPassword = await bcrypt.hash(userBody.password, config.bcrypt.rounds);

    const profileData: Prisma.UserProfileCreateWithoutUserInput = {};
    if (userBody.dateOfBirth !== undefined) {
      profileData.dateOfBirth = userBody.dateOfBirth ? new Date(userBody.dateOfBirth) : null;
    }
    if (userBody.nationality !== undefined) profileData.nationality = userBody.nationality;
    if (userBody.idCardNumber !== undefined) profileData.idCardNumber = userBody.idCardNumber;
    if (userBody.passportNumber !== undefined) profileData.passportNumber = userBody.passportNumber;
    if (userBody.preferredLanguage !== undefined) profileData.preferredLanguage = userBody.preferredLanguage;
    if (userBody.preferredCurrency !== undefined) profileData.preferredCurrency = userBody.preferredCurrency;
    if (userBody.marketingOptIn !== undefined) profileData.marketingOptIn = userBody.marketingOptIn;

    const hasProfileData = Object.keys(profileData).length > 0;

    return prisma.user.create({
      data: {
        fullName: userBody.name,
        email: userBody.email,
        passwordHash: hashedPassword,
        phone: userBody.phone || null,
        avatarUrl: userBody.avatarUrl || null,
        role: userBody.role || 'customer',
        status: 'active',
        profile: hasProfileData ? { create: profileData } : undefined,
      },
      include: {
        profile: true,
      },
    });
  };

  /**
   * Query for users
   * @param {UserFilter} filter
   * @param {UserQueryOptions} options
   * @returns {Promise<{ results: User[]; page: number; limit: number; totalPages: number; totalResults: number }>}
   */
  queryUsers = async (filter: UserFilter, options: UserQueryOptions) => {
    const limit = options.limit || 10;
    const page = options.page || 1;
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = { deletedAt: null };
    if (filter.name) {
      where.fullName = { contains: filter.name, mode: 'insensitive' };
    }
    if (filter.role) {
      where.role = filter.role;
    }

    let orderBy: Prisma.UserOrderByWithRelationInput | undefined;
    if (options.sortBy) {
      const [field, direction] = options.sortBy.split(':');
      orderBy = { [field]: direction === 'desc' ? 'desc' : 'asc' };
    }

    const [results, totalResults] = await prisma.$transaction([
      prisma.user.findMany({ where, skip, take: limit, orderBy }),
      prisma.user.count({ where }),
    ]);

    const totalPages = Math.ceil(totalResults / limit);

    return {
      results,
      page,
      limit,
      totalPages,
      totalResults,
    };
  };

  /**
   * Update user by id
   * @param {string} userId
   * @param {UpdateUserDto} updateBody
   * @returns {Promise<User>}
   */
  updateUserById = async (userId: string, updateBody: UpdateUserDto): Promise<User> => {
    const user = await this.getUserById(userId);
    if (!user) {
      throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    }

    if (updateBody.email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email: updateBody.email,
          id: { not: userId },
        },
      });
      if (existingUser) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
      }
    }

    const data: Prisma.UserUpdateInput = {};
    if (updateBody.name) data.fullName = updateBody.name;
    if (updateBody.email) data.email = updateBody.email;
    if (updateBody.password) {
      data.passwordHash = await bcrypt.hash(updateBody.password, config.bcrypt.rounds);
    }

    return prisma.user.update({
      where: { id: userId },
      data,
    });
  };

  /**
   * Delete user by id
   * @param {string} userId
   * @returns {Promise<User>}
   */
  deleteUserById = async (userId: string): Promise<User> => {
    const user = await this.getUserById(userId);
    if (!user) {
      throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    }

    return prisma.user.delete({
      where: { id: userId },
    });
  };
}

export const userService = new UserService();
