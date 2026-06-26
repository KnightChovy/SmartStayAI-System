import { useMutation } from '@tanstack/react-query';
import { authService } from '@/services/auth.service';
import type { SendOtpPayload } from '@/types/auth.type';

/** `POST /auth/send-otp` — gửi mã OTP về email trước khi đăng ký. */
export function useSendOtp() {
  return useMutation({
    mutationFn: (payload: SendOtpPayload) => authService.sendOtp(payload),
  });
}
