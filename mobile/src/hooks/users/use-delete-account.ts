import { useMutation, useQueryClient } from '@tanstack/react-query';
import { usersService } from '@/services/users.service';
import { useAuthStore } from '@/stores/authStore';

/**
 * `DELETE /users/:userId` — tự huỷ tài khoản của chính mình.
 * Lấy `userId` từ authStore rồi clear session sau khi xoá xong.
 */
export function useDeleteAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => {
      const userId = useAuthStore.getState().user?.id;
      if (!userId) throw new Error('Chưa đăng nhập.');
      return usersService.deleteAccount(userId);
    },
    onSuccess: () => {
      useAuthStore.getState().clearAuth();
      queryClient.clear();
    },
  });
}
