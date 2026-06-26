import { useMutation } from '@tanstack/react-query';
import { authService } from '@/services/auth.service';
import type { ResetPasswordPayload } from '@/types/auth.type';

interface ResetPasswordArgs {
  token: string;
  payload: ResetPasswordPayload;
}

/** `POST /auth/reset-password?token=...` — đặt lại mật khẩu bằng token email. */
export function useResetPassword() {
  return useMutation({
    mutationFn: ({ token, payload }: ResetPasswordArgs) =>
      authService.resetPassword(token, payload),
  });
}
