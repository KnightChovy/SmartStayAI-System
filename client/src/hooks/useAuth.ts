import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { authService } from '../services/auth.service';
import type { RegisterPayload, LoginPayload, ResetPasswordPayload } from '../services/auth.service';
import { useAuthStore } from '../stores/auth.store';

export function useAuth() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const currentRefreshToken = useAuthStore((state) => state.refreshToken);

  const loginMutation = useMutation({
    mutationFn: (payload: LoginPayload) => authService.login(payload),
    onSuccess: (data) => {
      const { user, tokens } = data;
      if (user && tokens?.access?.token && tokens?.refresh?.token) {
        setAuth(user, tokens.access.token, tokens.refresh.token);
      }
    },
  });

  const sendOtpMutation = useMutation({
    mutationFn: (email: string) => authService.sendOtp(email),
  });

  const registerMutation = useMutation({
    mutationFn: (payload: RegisterPayload) => authService.register(payload),
    onSuccess: (data) => {
      const { user, tokens } = data;
      if (user && tokens?.access?.token && tokens?.refresh?.token) {
        setAuth(user, tokens.access.token, tokens.refresh.token);
      }
    },
  });

  const logoutMutation = useMutation({
    mutationFn: () => {
      if (currentRefreshToken) {
        return authService.logout(currentRefreshToken);
      }
      return Promise.resolve();
    },
    onSettled: () => {
      clearAuth();
      navigate('/login');
    },
  });

  const forgotPasswordMutation = useMutation({
    mutationFn: (email: string) => authService.forgotPassword(email),
  });

  const resetPasswordMutation = useMutation({
    mutationFn: ({ token, payload }: { token: string; payload: ResetPasswordPayload }) =>
      authService.resetPassword(token, payload),
  });

  const verifyEmailMutation = useMutation({
    mutationFn: (token: string) => authService.verifyEmail(token),
  });

  return {
    user,
    isAuthenticated,

    login: loginMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    loginError: loginMutation.error,

    sendOtp: sendOtpMutation.mutateAsync,
    isSendingOtp: sendOtpMutation.isPending,
    sendOtpError: sendOtpMutation.error,

    register: registerMutation.mutateAsync,
    isRegistering: registerMutation.isPending,
    registerError: registerMutation.error,

    logout: logoutMutation.mutateAsync,
    isLoggingOut: logoutMutation.isPending,

    forgotPassword: forgotPasswordMutation.mutateAsync,
    isSendingForgotPassword: forgotPasswordMutation.isPending,
    forgotPasswordError: forgotPasswordMutation.error,
    forgotPasswordSuccess: forgotPasswordMutation.isSuccess,

    resetPassword: resetPasswordMutation.mutateAsync,
    isResettingPassword: resetPasswordMutation.isPending,
    resetPasswordError: resetPasswordMutation.error,
    resetPasswordSuccess: resetPasswordMutation.isSuccess,

    verifyEmail: verifyEmailMutation.mutateAsync,
    isVerifyingEmail: verifyEmailMutation.isPending,
    verifyEmailError: verifyEmailMutation.error,
    verifyEmailSuccess: verifyEmailMutation.isSuccess,
  };
}
