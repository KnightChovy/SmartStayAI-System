import type { UserRole, UserStatus } from '@prisma/client';

/**
 * Payload for creating a new user (used by registration / user creation).
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
 * Payload for updating a user (all fields optional).
 */
export interface UpdateUserDto {
  name?: string;
  email?: string;
  password?: string;
}

/**
 * Payload user tự cập nhật hồ sơ của CHÍNH MÌNH (self-service). Không có email/role/status —
 * những trường đó do admin quản, không cho tự đổi.
 */
export interface UpdateMyProfileDto {
  fullName?: string;
  phone?: string | null;
  avatarUrl?: string | null;
  dateOfBirth?: string | Date | null;
  nationality?: string | null;
  idCardNumber?: string | null;
  passportNumber?: string | null;
  preferredLanguage?: 'vi' | 'en';
  preferredCurrency?: 'VND' | 'USD';
  marketingOptIn?: boolean;
}

/** Payload user tự đổi mật khẩu khi đang đăng nhập (cần mật khẩu hiện tại). */
export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

/**
 * Filters for querying the list of users.
 */
export interface UserFilter {
  name?: string;
  role?: UserRole;
  status?: UserStatus;
}

/**
 * Pagination / sorting options when querying users.
 */
export interface UserQueryOptions {
  limit?: number;
  page?: number;
  sortBy?: string;
}
