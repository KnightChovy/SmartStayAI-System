import { useMutation } from '@tanstack/react-query';
import { authService } from '@/services/auth.service';

export function useSendOtpMutation() {
  return useMutation({
    mutationFn: (email: string) => authService.sendOtp(email),
  });
}
