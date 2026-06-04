import type { UserRole } from '@prisma/client';

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
 * Filters for querying the list of users.
 */
export interface UserFilter {
  name?: string;
  role?: UserRole;
}

/**
 * Pagination / sorting options when querying users.
 */
export interface UserQueryOptions {
  limit?: number;
  page?: number;
  sortBy?: string;
}
