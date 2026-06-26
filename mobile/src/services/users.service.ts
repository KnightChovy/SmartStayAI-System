import { api } from '@/lib/api';
import type { User } from '@/types/auth.type';
import type { UpdateProfilePayload } from '@/types/users.type';

/**
 * Tầng gọi API người dùng (`/v1/users`).
 *
 * Các route `/users/:userId` yêu cầu quyền admin, NHƯNG middleware `auth` cho phép
 * "self-access": user thường vẫn gọi được khi `:userId` chính là id của mình.
 * → Dùng `useAuthStore.getState().user.id` làm `userId` cho các hook bên dưới.
 */
export const usersService = {
  /** Lấy hồ sơ của chính mình (`GET /users/:userId`). */
  async getProfile(userId: string): Promise<User> {
    const { data } = await api.get<User>(`/users/${userId}`);
    return data;
  },

  /**
   * Cập nhật hồ sơ của chính mình (`PATCH /users/:userId`).
   * Backend chỉ nhận `email` / `password` / `name`; truyền tối thiểu 1 field.
   */
  async updateProfile(userId: string, payload: UpdateProfilePayload): Promise<User> {
    const { data } = await api.patch<User>(`/users/${userId}`, payload);
    return data;
  },

  /** Xoá (tự huỷ) tài khoản của chính mình (`DELETE /users/:userId`). */
  async deleteAccount(userId: string): Promise<void> {
    await api.delete(`/users/${userId}`);
  },
};
