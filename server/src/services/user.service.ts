import httpStatus from 'http-status';
import bcrypt from 'bcryptjs';
import type { Prisma, User, UserRole, UserStatus } from '@prisma/client';
import prisma from '../config/prisma';
import config from '../config/config';
import ApiError from '../utils/ApiError';
import type { CreateUserDto, UpdateUserDto, UserFilter, UserQueryOptions } from '../dto/user.dto';

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
    if (filter.status) {
      where.status = filter.status;
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
   * [Admin] Đổi trạng thái tài khoản (active / inactive / suspended).
   * Suspend có hiệu lực NGAY: passport + login đều chặn user status !== 'active'.
   * Không cho tự đổi trạng thái của chính mình (tránh admin tự khoá mình).
   */
  setUserStatus = async (userId: string, status: UserStatus, currentUser: User): Promise<User> => {
    if (userId === currentUser.id) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Không thể tự đổi trạng thái tài khoản của chính mình');
    }
    const user = await this.getUserById(userId);
    if (!user) {
      throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    }
    return prisma.user.update({ where: { id: userId }, data: { status } });
  };

  /**
   * [Admin, quyền manageRoles] Đổi vai trò 1 user.
   * Không cho tự đổi vai trò mình, và không cho hạ cấp admin CUỐI CÙNG (giữ tối thiểu 1 admin).
   */
  setUserRole = async (userId: string, role: UserRole, currentUser: User): Promise<User> => {
    if (userId === currentUser.id) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Không thể tự đổi vai trò của chính mình');
    }
    const user = await this.getUserById(userId);
    if (!user) {
      throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    }
    if (user.role === 'admin' && role !== 'admin') {
      const adminCount = await prisma.user.count({ where: { role: 'admin', deletedAt: null } });
      if (adminCount <= 1) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Không thể hạ cấp admin cuối cùng của hệ thống');
      }
    }
    return prisma.user.update({ where: { id: userId }, data: { role } });
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
