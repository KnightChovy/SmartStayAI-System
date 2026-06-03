import { useMutation } from '@tanstack/react-query';
import { authService } from '@/services/auth.service';

export function useVerifyEmailMutation() {
  return useMutation({
    mutationFn: (token: string) => authService.verifyEmail(token),
  });
}
