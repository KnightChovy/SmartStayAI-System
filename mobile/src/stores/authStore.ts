import { create } from 'zustand';
import type { User } from '@/types/auth.type';

/**
 * Auth session global state.
 *
 * Lưu access/refresh token + user đang đăng nhập. `lib/api.ts` đọc token từ đây
 * (qua `useAuthStore.getState()`) để gắn `Authorization` và tự refresh khi 401.
 *
 * ⚠️ Hiện chưa persist xuống `expo-secure-store` — token mất khi reload app.
 * Khi cài `expo-secure-store`, bọc store này bằng `persist` + secure storage adapter.
 */
interface AuthStore {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  updateUser: (patch: Partial<User>) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  setAuth: (user, accessToken, refreshToken) =>
    set({ user, accessToken, refreshToken, isAuthenticated: true }),
  setTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken }),
  updateUser: (patch) =>
    set((state) => (state.user ? { user: { ...state.user, ...patch } } : state)),
  clearAuth: () =>
    set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false }),
}));
