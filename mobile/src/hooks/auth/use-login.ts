import { useMutation } from '@tanstack/react-query';
import { authService } from '@/services/auth.service';

interface LoginCredentials {
  email: string;
  password: string;
}

export function useLogin() {
  return useMutation({
    mutationFn: ({ email, password }: LoginCredentials) =>
      authService.login(email, password),
  });
}
