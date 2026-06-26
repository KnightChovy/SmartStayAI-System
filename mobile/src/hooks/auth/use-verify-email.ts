import { useMutation } from '@tanstack/react-query';
import { authService } from '@/services/auth.service';

/** `POST /auth/verify-email?token=...` — xác minh email bằng token. */
export function useVerifyEmail() {
  return useMutation({
    mutationFn: (token: string) => authService.verifyEmail(token),
  });
}
