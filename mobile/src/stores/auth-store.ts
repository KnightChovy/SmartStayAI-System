import { create } from 'zustand';
import type { UserProfile } from '@/types/auth.types';
interface AuthState {
  user: UserProfile | null;
  accessToken: string | null;
  refreshToken: string | null;
  setSession: (
    user: UserProfile,
    accessToken: string,
    refreshToken: string
  ) => void;
  updateUser: (user: UserProfile) => void;
  clearSession: () => void;
}
export const useAuthStore = create<AuthState>(set => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  setSession: (user, accessToken, refreshToken) =>
    set({ user, accessToken, refreshToken }),
  updateUser: user => set({ user }),
  clearSession: () =>
    set({ user: null, accessToken: null, refreshToken: null }),
}));
