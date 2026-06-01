import type { UserRole } from '@prisma/client';

/**
 * Dữ liệu tạo mới một người dùng (dùng cho đăng ký / tạo user).
 */
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

/**
 * Dữ liệu cập nhật người dùng (mọi trường đều tuỳ chọn).
 */
export interface UpdateUserDto {
  name?: string;
  email?: string;
  password?: string;
}

/**
 * Bộ lọc khi truy vấn danh sách người dùng.
 */
export interface UserFilter {
  name?: string;
  role?: UserRole;
}

/**
 * Tuỳ chọn phân trang / sắp xếp khi truy vấn người dùng.
 */
export interface UserQueryOptions {
  limit?: number;
  page?: number;
  sortBy?: string;
}
