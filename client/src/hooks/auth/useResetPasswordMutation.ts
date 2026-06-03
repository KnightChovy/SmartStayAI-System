import { useMutation } from '@tanstack/react-query';
import { authService } from '@/services/auth.service';
import type { ResetPasswordPayload } from '@/types/auth.types';

export function useResetPasswordMutation() {
  return useMutation({
    mutationFn: ({
      token,
      payload,
    }: {
      token: string;
      payload: ResetPasswordPayload;
    }) => authService.resetPassword(token, payload),
  });
}
