import { api } from '@/lib/api';
import type { AuthResponse, RegisterPayload } from '@/types/auth.types';
export const authService = {
  sendOtp: async (email: string): Promise<void> => {
    await api.post('/auth/send-otp', { email });
  },
  login: async (email: string, password: string): Promise<AuthResponse> =>
    (await api.post<AuthResponse>('/auth/login', { email, password })).data,
  register: async (payload: RegisterPayload): Promise<void> => {
    await api.post('/auth/register', payload);
  },
};
