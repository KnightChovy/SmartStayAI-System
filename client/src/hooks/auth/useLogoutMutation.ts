import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/stores/authStore';

export function useLogoutMutation() {
  const navigate = useNavigate();
  const clearAuth = useAuthStore(state => state.clearAuth);
  const currentRefreshToken = useAuthStore(state => state.refreshToken);

  return useMutation({
    mutationFn: () => {
      if (currentRefreshToken) {
        return authService.logout(currentRefreshToken);
      }
      return Promise.resolve();
    },
    onSettled: () => {
      clearAuth();
      navigate('/login');
    },
  });
}
