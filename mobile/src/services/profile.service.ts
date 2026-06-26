import { api } from '@/lib/api';
import type { UpdateProfilePayload, UserProfile } from '@/types/auth.types';
export const profileService = {
  getMine: async (): Promise<UserProfile> =>
    (await api.get<UserProfile>('/users/me')).data,
  updateMine: async (payload: UpdateProfilePayload): Promise<UserProfile> =>
    (await api.patch<UserProfile>('/users/me', payload)).data,
};
