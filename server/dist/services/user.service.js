"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUserById = exports.updateUserById = exports.queryUsers = exports.createUser = exports.getUserById = exports.getUserByEmail = void 0;
const http_status_1 = __importDefault(require("http-status"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma_1 = __importDefault(require("../config/prisma"));
const ApiError_1 = __importDefault(require("../utils/ApiError"));
/**
 * Get user by email
 * @param {string} email
 * @returns {Promise<any>}
 */
const getUserByEmail = async (email) => {
    return prisma_1.default.user.findUnique({ where: { email } });
};
exports.getUserByEmail = getUserByEmail;
/**
 * Get user by id
 * @param {string} id
 * @returns {Promise<any>}
 */
const getUserById = async (id) => {
    return prisma_1.default.user.findUnique({ where: { id } });
};
exports.getUserById = getUserById;
/**
 * Create a user
 * @param {Object} userBody
 * @returns {Promise<any>}
 */
const createUser = async (userBody) => {
    const existingUser = await (0, exports.getUserByEmail)(userBody.email);
    if (existingUser) {
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, 'Email already taken');
    }
    const hashedPassword = await bcryptjs_1.default.hash(userBody.password, 8);
    return prisma_1.default.user.create({
        data: {
            fullName: userBody.name,
            email: userBody.email,
            passwordHash: hashedPassword,
            role: userBody.role || 'customer',
            status: 'active',
        },
    });
};
exports.createUser = createUser;
/**
 * Query for users
 * @param {Object} filter
 * @param {Object} options
 * @returns {Promise<any>}
 */
const queryUsers = async (filter, options) => {
    const limit = options.limit || 10;
    const page = options.page || 1;
    const skip = (page - 1) * limit;
    const where = {};
    if (filter.name) {
        where.fullName = { contains: filter.name, mode: 'insensitive' };
    }
    if (filter.role) {
        where.role = filter.role;
    }
    const [results, totalResults] = await prisma_1.default.$transaction([
        prisma_1.default.user.findMany({
            where,
            skip,
            take: limit,
            orderBy: options.sortBy ? { [options.sortBy.split(':')[0]]: options.sortBy.split(':')[1] || 'asc' } : undefined,
        }),
        prisma_1.default.user.count({ where }),
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
exports.queryUsers = queryUsers;
/**
 * Update user by id
 * @param {string} userId
 * @param {Object} updateBody
 * @returns {Promise<any>}
 */
const updateUserById = async (userId, updateBody) => {
    const user = await (0, exports.getUserById)(userId);
    if (!user) {
        throw new ApiError_1.default(http_status_1.default.NOT_FOUND, 'User not found');
    }
    if (updateBody.email) {
        const existingUser = await prisma_1.default.user.findFirst({
            where: {
                email: updateBody.email,
                id: { not: userId },
            },
        });
        if (existingUser) {
            throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, 'Email already taken');
        }
    }
    const data = {};
    if (updateBody.name)
        data.fullName = updateBody.name;
    if (updateBody.email)
        data.email = updateBody.email;
    if (updateBody.password) {
        data.passwordHash = await bcryptjs_1.default.hash(updateBody.password, 8);
    }
    return prisma_1.default.user.update({
        where: { id: userId },
        data,
    });
};
exports.updateUserById = updateUserById;
/**
 * Delete user by id
 * @param {string} userId
 * @returns {Promise<any>}
 */
const deleteUserById = async (userId) => {
    const user = await (0, exports.getUserById)(userId);
    if (!user) {
        throw new ApiError_1.default(http_status_1.default.NOT_FOUND, 'User not found');
    }
    return prisma_1.default.user.delete({
        where: { id: userId },
    });
};
exports.deleteUserById = deleteUserById;
