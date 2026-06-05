import { useMutation } from '@tanstack/react-query';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/stores/authStore';
import type { LoginPayload } from '@/types/auth.types';

export function useLoginMutation() {
  const setAuth = useAuthStore(state => state.setAuth);

  return useMutation({
    mutationFn: (payload: LoginPayload) => authService.login(payload),
    onSuccess: data => {
      const { user, tokens } = data;
      if (user && tokens?.access?.token && tokens?.refresh?.token) {
        setAuth(user, tokens.access.token, tokens.refresh.token);
      }
    },
  });
}
