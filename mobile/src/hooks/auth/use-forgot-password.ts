import { useMutation } from '@tanstack/react-query';
import { authService } from '@/services/auth.service';
import type { ForgotPasswordPayload } from '@/types/auth.type';

/** `POST /auth/forgot-password` — gửi link/mã đặt lại mật khẩu về email. */
export function useForgotPassword() {
  return useMutation({
    mutationFn: (payload: ForgotPasswordPayload) => authService.forgotPassword(payload),
  });
}
