import { api } from '../lib/api';

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

export const authService = {
  sendOtp: async (email: string) => {
    const response = await api.post('/auth/send-otp', { email });
    return response.data;
  },

  register: async (payload: RegisterPayload) => {
    const response = await api.post('/auth/register', payload);
    return response.data;
  },

  login: async (payload: LoginPayload) => {
    const response = await api.post('/auth/login', payload);
    return response.data;
  },

  logout: async (refreshToken: string) => {
    const response = await api.post('/auth/logout', { refreshToken });
    return response.data;
  },

  forgotPassword: async (email: string) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  resetPassword: async (token: string, payload: ResetPasswordPayload) => {
    const response = await api.post(
      `/auth/reset-password?token=${token}`,
      payload
    );
    return response.data;
  },

  verifyEmail: async (token: string) => {
    const response = await api.post(`/auth/verify-email?token=${token}`);
    return response.data;
  },
};
