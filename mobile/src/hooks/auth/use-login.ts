import { useMutation } from '@tanstack/react-query';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/stores/authStore';
import type { LoginPayload } from '@/types/auth.type';

/** `POST /auth/login` — đăng nhập rồi lưu user + token vào authStore. */
export function useLogin() {
  const setAuth = useAuthStore((s) => s.setAuth);
  return useMutation({
    mutationFn: (payload: LoginPayload) => authService.login(payload),
    onSuccess: ({ user, tokens }) => {
      setAuth(user, tokens.access.token, tokens.refresh.token);
    },
  });
}
