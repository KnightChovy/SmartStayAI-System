export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  phone?: string | null;
  avatarUrl?: string | null;
  status: string;
  emailVerifiedAt?: string | null;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  clearAuth: () => void;
  updateUser: (user: Partial<User>) => void;
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
