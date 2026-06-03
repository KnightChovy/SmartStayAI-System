import { useMutation } from '@tanstack/react-query';
import { authService } from '@/services/auth.service';

export function useForgotPasswordMutation() {
  return useMutation({
    mutationFn: (email: string) => authService.forgotPassword(email),
  });
}
