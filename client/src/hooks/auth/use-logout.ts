import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/stores/authStore';

export function useLogout() {
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
    onSuccess: () => {
      toast.success('Logged out successfully', { duration: 3000 });
    },
    onSettled: () => {
      clearAuth();
      navigate('/');
    },
  });
}
