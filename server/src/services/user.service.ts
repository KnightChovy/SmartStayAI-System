import httpStatus from 'http-status';
import bcrypt from 'bcryptjs';
import prisma from '../config/prisma';
import ApiError from '../utils/ApiError';

/**
 * Get user by email
 * @param {string} email
 * @returns {Promise<any>}
 */
export const getUserByEmail = async (email: string) => {
  return prisma.user.findUnique({ where: { email } });
};

/**
 * Get user by id
 * @param {string} id
 * @returns {Promise<any>}
 */
export const getUserById = async (id: string) => {
  return prisma.user.findUnique({ where: { id } });
};

/**
 * Create a user
 * @param {Object} userBody
 * @returns {Promise<any>}
 */
export const createUser = async (userBody: any) => {
  const existingUser = await getUserByEmail(userBody.email);
  if (existingUser) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
  }

  const hashedPassword = await bcrypt.hash(userBody.password, 8);

  const profileData: any = {};
  if (userBody.dateOfBirth !== undefined) profileData.dateOfBirth = userBody.dateOfBirth ? new Date(userBody.dateOfBirth) : null;
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
      profile: hasProfileData ? {
        create: profileData,
      } : undefined,
    },
    include: {
      profile: true,
    },
  });
};

/**
 * Query for users
 * @param {Object} filter
 * @param {Object} options
 * @returns {Promise<any>}
 */
export const queryUsers = async (filter: any, options: any) => {
  const limit = options.limit || 10;
  const page = options.page || 1;
  const skip = (page - 1) * limit;

  const where: any = {};
  if (filter.name) {
    where.fullName = { contains: filter.name, mode: 'insensitive' };
  }
  if (filter.role) {
    where.role = filter.role;
  }

  const [results, totalResults] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: options.sortBy ? { [options.sortBy.split(':')[0]]: options.sortBy.split(':')[1] || 'asc' } : undefined,
    }),
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
 * @param {Object} updateBody
 * @returns {Promise<any>}
 */
export const updateUserById = async (userId: string, updateBody: any) => {
  const user = await getUserById(userId);
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

  const data: any = {};
  if (updateBody.name) data.fullName = updateBody.name;
  if (updateBody.email) data.email = updateBody.email;
  if (updateBody.password) {
    data.passwordHash = await bcrypt.hash(updateBody.password, 8);
  }

  return prisma.user.update({
    where: { id: userId },
    data,
  });
};

/**
 * Delete user by id
 * @param {string} userId
 * @returns {Promise<any>}
 */
export const deleteUserById = async (userId: string) => {
  const user = await getUserById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  return prisma.user.delete({
    where: { id: userId },
  });
};
