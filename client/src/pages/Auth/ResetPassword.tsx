import { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { useResetPasswordMutation } from '../../hooks/auth';
import {
  resetPasswordSchema,
  type ResetPasswordInput,
} from '../../validations/auth.validation';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const {
    mutateAsync: resetPassword,
    isPending: isResettingPassword,
    error: resetPasswordError,
    isSuccess: resetPasswordSuccess,
  } = useResetPasswordMutation();

  const [passwordFocused, setPasswordFocused] = useState(false);
  const [confirmPasswordFocused, setConfirmPasswordFocused] = useState(false);

  const {
    register,
    handleSubmit: handleFormSubmit,
    formState: { errors },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: ResetPasswordInput) => {
    if (!token) {
      alert('Missing verification token! Please check your recovery email.');
      return;
    }
    try {
      await resetPassword({ token, payload: { password: data.password } });
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="relative min-h-screen text-on-surface select-none overflow-hidden h-screen w-screen bg-background antialiased flex items-center justify-center px-margin-mobile">
      <style>{`
        .glass-card {
          background: rgba(245, 242, 238, 0.7);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.3);
        }
        .material-symbols-outlined {
          font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
      `}</style>

      <main className="relative z-10 w-full max-w-md">
        <div className="text-center mb-stack-lg">
          <Link
            to="/"
            className="inline-block hover:opacity-90 transition-opacity"
          >
           <h1 className="font-display-lg text-3xl font-extrabold tracking-widest uppercase text-black-">
                  SMART STAY AI
              </h1>
          </Link>
        </div>

        <div
          className="glass-card w-full p-stack-lg rounded-[16px] shadow-[0_20px_40px_rgba(0,0,0,0.08)]"
          style={{
            transform:
              passwordFocused || confirmPasswordFocused
                ? 'scale(1.01)'
                : 'scale(1)',
            transition:
              'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          }}
        >
          <div className="text-center mb-stack-lg">
            <h2 className="font-headline-lg-mobile text-headline-lg-mobile md:font-headline-lg md:text-headline-lg text-on-surface mb-stack-sm font-semibold">
              Enter New Password
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-70 mx-auto">
              Please enter your new password to regain access to your dashboard.
            </p>
          </div>

          {!token ? (
            <div className="bg-error/10 border border-error/20 text-error p-4 rounded-xl text-center font-body-md mb-6">
              <span className="material-symbols-outlined text-3xl mb-2 block">
                error
              </span>
              <p className="font-semibold">Invalid Recovery Link</p>
              <p className="text-sm mt-1">
                This token is missing or has expired. Please request a new link.
              </p>
              <Link
                to="/forgot-password"
                className="mt-4 inline-block text-secondary font-bold hover:underline"
              >
                Go to Forgot Password
              </Link>
            </div>
          ) : resetPasswordSuccess ? (
            <div className="bg-green-800/10 border border-green-800/20 text-green-700 p-4 rounded-xl text-center font-body-md mb-6">
              <span className="material-symbols-outlined text-green-800 text-3xl mb-2 block">
                check_circle
              </span>
              <p className="font-semibold">Password Reset Successful!</p>
              <p className="text-sm mt-1">
                Your password has been changed successfully. Redirecting you to
                login...
              </p>
            </div>
          ) : (
            <form
              className="space-y-stack-md"
              onSubmit={handleFormSubmit(onSubmit)}
            >
              {resetPasswordError && (
                <div className="bg-error/10 border border-error/20 text-error p-3 rounded-xl text-sm font-semibold">
                  {(resetPasswordError as any)?.response?.data?.message ||
                    'Failed to reset password. Please try again.'}
                </div>
              )}

              <div>
                <Label
                  className="block font-label-lg text-label-lg text-on-surface-variant mb-2"
                  htmlFor="password"
                >
                  New Password
                </Label>
                <Input
                  {...register('password')}
                  className="w-full bg-primary-container border-none focus:ring-2 focus:ring-secondary/20 rounded-[16px] px-4 py-3 text-body-md text-on-surface placeholder:text-outline-variant transition-all duration-300 outline-none h-auto"
                  id="password"
                  placeholder="••••••••"
                  type="password"
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                />
                {errors.password && (
                  <p className="text-[10px] text-error font-semibold mt-1.5 px-1">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <div>
                <Label
                  className="block font-label-lg text-label-lg text-on-surface-variant mb-2"
                  htmlFor="confirmPassword"
                >
                  Confirm Password
                </Label>
                <Input
                  {...register('confirmPassword')}
                  className="w-full bg-primary-container border-none focus:ring-2 focus:ring-secondary/20 rounded-[16px] px-4 py-3 text-body-md text-on-surface placeholder:text-outline-variant transition-all duration-300 outline-none h-auto"
                  id="confirmPassword"
                  placeholder="••••••••"
                  type="password"
                  onFocus={() => setConfirmPasswordFocused(true)}
                  onBlur={() => setConfirmPasswordFocused(false)}
                />
                {errors.confirmPassword && (
                  <p className="text-[10px] text-error font-semibold mt-1.5 px-1">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>

              <Button
                className="w-full bg-primary text-on-primary font-label-lg text-label-lg py-4 rounded-[16px] hover:bg-primary/95 active:scale-[0.98] transition-all duration-200 shadow-sm flex items-center justify-center gap-2 group cursor-pointer outline-none border-none h-auto"
                type="submit"
                disabled={isResettingPassword}
              >
                {isResettingPassword
                  ? 'Resetting Password...'
                  : 'Reset Password'}
                {!isResettingPassword && (
                  <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">
                    arrow_forward
                  </span>
                )}
              </Button>
            </form>
          )}

          <div className="mt-stack-lg text-center">
            <Link
              className="inline-flex items-center gap-2 font-label-lg text-label-lg text-secondary hover:text-on-secondary-container transition-colors duration-200"
              to="/login"
            >
              <span className="material-symbols-outlined text-[18px]">
                arrow_back
              </span>
              Back to Login
            </Link>
          </div>
        </div>
      </main>

      <div className="fixed bottom-0 right-0 w-[50vw] h-128 bg-secondary/5 blur-[120px] rounded-full pointer-events-none z-0"></div>
      <div className="fixed top-0 left-0 w-[30vw] h-76.75 bg-primary/5 blur-[100px] rounded-full pointer-events-none z-0"></div>
    </div>
  );
}
