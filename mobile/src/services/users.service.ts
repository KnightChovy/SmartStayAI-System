import { api } from '@/lib/api';
import type { User } from '@/types/auth.type';
import type {
  ChangePasswordPayload,
  MyProfile,
  MyProfileResponse,
  UpdateMyProfilePayload,
  UpdateProfilePayload,
} from '@/types/users.type';

/** Map response lồng (User + profile) về view-model phẳng cho form. */
function toViewModel(res: MyProfileResponse): MyProfile {
  const p = res.profile;
  return {
    fullName: res.fullName ?? '',
    email: res.email ?? '',
    phone: res.phone ?? '',
    avatarUrl: res.avatarUrl ?? null,
    emailVerifiedAt: res.emailVerifiedAt ?? null,
    // BE trả ISO datetime; form dùng YYYY-MM-DD nên cắt phần ngày.
    dateOfBirth: p?.dateOfBirth ? p.dateOfBirth.slice(0, 10) : null,
    nationality: p?.nationality ?? null,
    idCardNumber: p?.idCardNumber ?? null,
    passportNumber: p?.passportNumber ?? null,
  };
}

/** Chuẩn hoá patch phẳng → DTO (chuỗi rỗng → null để BE xoá field). */
function toDto(patch: UpdateMyProfilePayload): UpdateMyProfilePayload {
  const dto: UpdateMyProfilePayload = {};
  if (patch.fullName !== undefined) dto.fullName = patch.fullName;
  if (patch.phone !== undefined) dto.phone = patch.phone || null;
  if (patch.avatarUrl !== undefined) dto.avatarUrl = patch.avatarUrl || null;
  if (patch.dateOfBirth !== undefined) dto.dateOfBirth = patch.dateOfBirth || null;
  if (patch.nationality !== undefined) dto.nationality = patch.nationality || null;
  if (patch.idCardNumber !== undefined) dto.idCardNumber = patch.idCardNumber || null;
  if (patch.passportNumber !== undefined) dto.passportNumber = patch.passportNumber || null;
  return dto;
}

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

  /** Hồ sơ self-service của chính mình (`GET /users/me`, id lấy từ token). */
  async getMyProfile(): Promise<MyProfile> {
    const { data } = await api.get<MyProfileResponse>('/users/me');
    return toViewModel(data);
  },

  /** Cập nhật hồ sơ self-service (`PATCH /users/me`) — chỉ gửi field đã đổi. */
  async updateMyProfile(patch: UpdateMyProfilePayload): Promise<MyProfile> {
    const { data } = await api.patch<MyProfileResponse>('/users/me', toDto(patch));
    return toViewModel(data);
  },

  /**
   * Đổi mật khẩu khi đang đăng nhập (`PATCH /users/me/password`).
   * Backend xác minh `currentPassword` rồi băm `newPassword`; trả 204 No Content.
   */
  async changeMyPassword(payload: ChangePasswordPayload): Promise<void> {
    await api.patch('/users/me/password', payload);
  },

  /** Xoá (tự huỷ) tài khoản của chính mình (`DELETE /users/:userId`). */
  async deleteAccount(userId: string): Promise<void> {
    await api.delete(`/users/${userId}`);
  },
};
