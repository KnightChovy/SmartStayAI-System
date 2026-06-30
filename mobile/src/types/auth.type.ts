/** Type cho luồng auth — model theo backend (`/v1/auth/*`). */

export type UserRole =
  | 'guest'
  | 'customer'
  | 'staff'
  | 'marketer'
  | 'hotel_partner'
  | 'platform_manager'
  | 'admin';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  phone?: string | null;
  avatarUrl?: string | null;
  status: string;
  emailVerifiedAt?: string | null;
}

export interface AuthToken {
  token: string;
  expires?: string;
}

export interface AuthTokens {
  access: AuthToken;
  refresh: AuthToken;
}

/** Response của `POST /auth/login` và `POST /auth/register`. */
export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

export interface SendOtpPayload {
  email: string;
}

export interface RegisterPayload {
  email: string;
  password?: string;
  name: string;
  verificationCode: string;
  phone?: string | null;
  avatarUrl?: string | null;
  dateOfBirth?: string | null;
  nationality?: string | null;
  idCardNumber?: string | null;
  passportNumber?: string | null;
  preferredLanguage?: 'vi' | 'en';
  preferredCurrency?: 'VND' | 'USD';
  marketingOptIn?: boolean;
}

export interface LoginPayload {
  email: string;
  password?: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  password?: string;
}

export interface VerifyEmailPayload {
  token: string;
}
