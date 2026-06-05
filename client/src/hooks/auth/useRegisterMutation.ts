import { useMutation } from '@tanstack/react-query';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/stores/authStore';
import type { RegisterPayload } from '@/types/auth.types';

export function useRegisterMutation() {
  const setAuth = useAuthStore(state => state.setAuth);

  return useMutation({
    mutationFn: (payload: RegisterPayload) => authService.register(payload),
    onSuccess: data => {
      const { user, tokens } = data;
      if (user && tokens?.access?.token && tokens?.refresh?.token) {
        setAuth(user, tokens.access.token, tokens.refresh.token);
      }
    },
  });
}
