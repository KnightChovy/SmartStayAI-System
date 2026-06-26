import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/stores/authStore';

/**
 * `POST /auth/logout` — vô hiệu hoá refresh token phía server rồi clear session.
 * Luôn clear local kể cả khi request lỗi (token có thể đã hết hạn).
 */
export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { refreshToken } = useAuthStore.getState();
      if (refreshToken) {
        await authService.logout(refreshToken);
      }
    },
    onSettled: () => {
      useAuthStore.getState().clearAuth();
      queryClient.clear();
    },
  });
}
