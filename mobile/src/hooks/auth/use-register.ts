import { useMutation } from '@tanstack/react-query';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/stores/authStore';
import type { RegisterPayload } from '@/types/auth.type';

/** `POST /auth/register` — đăng ký rồi lưu user + token vào authStore. */
export function useRegister() {
  const setAuth = useAuthStore((s) => s.setAuth);
  return useMutation({
    mutationFn: (payload: RegisterPayload) => authService.register(payload),
    onSuccess: ({ user, tokens }) => {
      setAuth(user, tokens.access.token, tokens.refresh.token);
    },
  });
}
