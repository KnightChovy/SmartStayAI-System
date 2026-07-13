import type { RouteObject } from 'react-router';
import RegisterPage from '@/pages/auth/RegisterPage';
import RegisterPartnerPage from '@/pages/auth/RegisterPartnerPage';
import LoginPage from '@/pages/auth/LoginPage';
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage';
import VerifyIdentityPage from '@/pages/auth/VerifyIdentityPage';
import ResetPasswordPage from '@/pages/auth/ResetPasswordPage';
import VerifyEmailPage from '@/pages/auth/VerifyEmailPage';

/** Route công khai cho xác thực: đăng nhập, đăng ký, quên/đặt lại mật khẩu. */
export const authRoutes: RouteObject[] = [
  { path: 'register', element: <RegisterPage /> },
  { path: 'partner-signup', element: <RegisterPartnerPage /> },
  { path: 'login', element: <LoginPage /> },
  { path: 'forgot-password', element: <ForgotPasswordPage /> },
  { path: 'verify-identity', element: <VerifyIdentityPage /> },
  { path: 'reset-password', element: <ResetPasswordPage /> },
  { path: 'verify-email', element: <VerifyEmailPage /> },
];
