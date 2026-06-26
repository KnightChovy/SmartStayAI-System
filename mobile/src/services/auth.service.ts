import { api } from '@/lib/api';
import type {
  AuthResponse,
  ForgotPasswordPayload,
  LoginPayload,
  RegisterPayload,
  ResetPasswordPayload,
  SendOtpPayload,
} from '@/types/auth.type';

/** Tầng gọi API xác thực (`/v1/auth/*`). */
export const authService = {
  /** Gửi mã OTP về email (bước trước khi đăng ký). */
  async sendOtp(payload: SendOtpPayload): Promise<{ message: string }> {
    const { data } = await api.post('/auth/send-otp', payload);
    return data;
  },

  /** Đăng ký tài khoản mới (kèm mã OTP đã nhận). */
  async register(payload: RegisterPayload): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/auth/register', payload);
    return data;
  },

  /** Đăng nhập — trả về user + cặp token. */
  async login(payload: LoginPayload): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/auth/login', payload);
    return data;
  },

  /** Đăng xuất — vô hiệu hoá refresh token phía server. */
  async logout(refreshToken: string): Promise<void> {
    await api.post('/auth/logout', { refreshToken });
  },

  /** Làm mới cặp token từ refresh token. */
  async refreshTokens(refreshToken: string): Promise<AuthResponse['tokens']> {
    const { data } = await api.post<AuthResponse['tokens']>('/auth/refresh-tokens', {
      refreshToken,
    });
    return data;
  },

  /** Quên mật khẩu — gửi link/mã đặt lại về email. */
  async forgotPassword(payload: ForgotPasswordPayload): Promise<void> {
    await api.post('/auth/forgot-password', payload);
  },

  /** Đặt lại mật khẩu bằng token nhận qua email. */
  async resetPassword(token: string, payload: ResetPasswordPayload): Promise<void> {
    await api.post('/auth/reset-password', payload, { params: { token } });
  },

  /** Gửi lại email xác minh (cần đăng nhập). */
  async sendVerificationEmail(): Promise<void> {
    await api.post('/auth/send-verification-email');
  },

  /** Xác minh email bằng token. */
  async verifyEmail(token: string): Promise<void> {
    await api.post('/auth/verify-email', undefined, { params: { token } });
  },
};
