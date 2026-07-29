import { useMutation } from '@tanstack/react-query';
import { profileService } from '@/services/profile.service';
import type { ChangePasswordDto } from '@/types/account.types';

/** Đổi mật khẩu (`PATCH /users/me/password`). Không có cache nào để invalidate. */
export function useChangePassword() {
  return useMutation({
    mutationFn: (dto: ChangePasswordDto) => profileService.changePassword(dto),
  });
}
