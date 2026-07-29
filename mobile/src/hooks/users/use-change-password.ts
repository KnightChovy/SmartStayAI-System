import { useMutation } from '@tanstack/react-query';
import { usersService } from '@/services/users.service';
import { useAuthStore } from '@/stores/authStore';
import type { ChangePasswordPayload } from '@/types/users.type';

/**
 * `PATCH /users/me/password` — đổi mật khẩu khi đang đăng nhập.
 * Backend tự xác minh mật khẩu hiện tại; không cần `userId` vì lấy từ token.
 */
export function useChangePassword() {
  return useMutation({
    mutationFn: (payload: ChangePasswordPayload) => {
      const userId = useAuthStore.getState().user?.id;
      if (!userId) throw new Error('Chưa đăng nhập.');
      return usersService.changeMyPassword(payload);
    },
  });
}
