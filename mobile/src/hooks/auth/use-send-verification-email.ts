import { useMutation } from '@tanstack/react-query';
import { authService } from '@/services/auth.service';

/** `POST /auth/send-verification-email` — gửi lại email xác minh (cần đăng nhập). */
export function useSendVerificationEmail() {
  return useMutation({
    mutationFn: () => authService.sendVerificationEmail(),
  });
}
