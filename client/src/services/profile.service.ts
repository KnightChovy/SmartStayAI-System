import { api } from '@/lib/api';
import type {
  UserProfile,
  MyProfileResponse,
  UpdateMyProfileDto,
  ChangePasswordDto,
} from '@/types/account.types';

/**
 * Hồ sơ cá nhân của user đang đăng nhập — gọi API thật `GET/PATCH /users/me`.
 * Map response lồng (User + profile) về view-model phẳng `UserProfile` cho form,
 * và map ngược patch phẳng về `UpdateMyProfileDto` (chỉ gửi field self-service).
 */

function toViewModel(res: MyProfileResponse): UserProfile {
  const p = res.profile;
  return {
    fullName: res.fullName ?? '',
    email: res.email ?? '',
    phone: res.phone ?? '',
    avatarUrl: res.avatarUrl ?? null,
    emailVerifiedAt: res.emailVerifiedAt ?? null,
    // API trả ISO datetime; form dùng <input type="date"> nên cắt còn YYYY-MM-DD.
    dateOfBirth: p?.dateOfBirth ? p.dateOfBirth.slice(0, 10) : null,
    nationality: p?.nationality ?? null,
    idCardNumber: p?.idCardNumber ?? null,
    passportNumber: p?.passportNumber ?? null,
    preferredLanguage: p?.preferredLanguage ?? 'vi',
    preferredCurrency: p?.preferredCurrency ?? 'VND',
    marketingOptIn: p?.marketingOptIn ?? false,
  };
}

/** Whitelist field được phép sửa; bỏ email/emailVerifiedAt (BE reject unknown key). */
function toDto(patch: Partial<UserProfile>): UpdateMyProfileDto {
  const dto: UpdateMyProfileDto = {};
  if (patch.fullName !== undefined) dto.fullName = patch.fullName;
  if (patch.phone !== undefined) dto.phone = patch.phone || null;
  if (patch.avatarUrl !== undefined) dto.avatarUrl = patch.avatarUrl || null;
  if (patch.dateOfBirth !== undefined) dto.dateOfBirth = patch.dateOfBirth || null;
  if (patch.nationality !== undefined) dto.nationality = patch.nationality || null;
  if (patch.idCardNumber !== undefined) dto.idCardNumber = patch.idCardNumber || null;
  if (patch.passportNumber !== undefined) dto.passportNumber = patch.passportNumber || null;
  if (patch.preferredLanguage !== undefined) dto.preferredLanguage = patch.preferredLanguage;
  if (patch.preferredCurrency !== undefined) dto.preferredCurrency = patch.preferredCurrency;
  if (patch.marketingOptIn !== undefined) dto.marketingOptIn = patch.marketingOptIn;
  return dto;
}

export const profileService = {
  async get(): Promise<UserProfile> {
    const { data } = await api.get<MyProfileResponse>('/users/me');
    return toViewModel(data);
  },

  async update(patch: Partial<UserProfile>): Promise<UserProfile> {
    const { data } = await api.patch<MyProfileResponse>('/users/me', toDto(patch));
    return toViewModel(data);
  },

  /** Đổi mật khẩu (`PATCH /users/me/password`). BE trả 204, không có body. */
  async changePassword(dto: ChangePasswordDto): Promise<void> {
    await api.patch('/users/me/password', dto);
  },
};
