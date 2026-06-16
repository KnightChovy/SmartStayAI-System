import { delay, readMock, writeMock } from './mock/mockStore';
import type { UserProfile } from '@/types/account.types';

/**
 * [MOCK] Hồ sơ cá nhân. Backend chưa có endpoint self-profile (route `/users`
 * hiện chỉ cho admin), nên lưu phần mở rộng vào localStorage.
 * `seed` là dữ liệu cơ bản lấy từ phiên đăng nhập (tên, email, avatar...).
 */
const KEY = 'profile';

export const profileService = {
  async get(seed: Partial<UserProfile>): Promise<UserProfile> {
    const stored = readMock<Partial<UserProfile>>(KEY, {});
    const merged: UserProfile = {
      fullName: stored.fullName ?? seed.fullName ?? '',
      email: seed.email ?? stored.email ?? '',
      phone: stored.phone ?? seed.phone ?? '',
      avatarUrl: stored.avatarUrl ?? seed.avatarUrl ?? null,
      emailVerifiedAt: seed.emailVerifiedAt ?? null,
      dateOfBirth: stored.dateOfBirth ?? null,
      nationality: stored.nationality ?? null,
      idCardNumber: stored.idCardNumber ?? null,
      passportNumber: stored.passportNumber ?? null,
      preferredLanguage: stored.preferredLanguage ?? 'vi',
      preferredCurrency: stored.preferredCurrency ?? 'VND',
      marketingOptIn: stored.marketingOptIn ?? false,
    };
    return delay(merged);
  },

  async update(patch: Partial<UserProfile>): Promise<UserProfile> {
    const stored = readMock<Partial<UserProfile>>(KEY, {});
    const next = { ...stored, ...patch };
    writeMock(KEY, next);
    return delay(next as UserProfile);
  },
};
