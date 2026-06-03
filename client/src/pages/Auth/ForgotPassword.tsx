import { useState } from 'react';
import { Link } from 'react-router';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForgotPasswordMutation } from '../../hooks/auth';
import {
  forgotPasswordSchema,
  type ForgotPasswordFormValues,
} from '../../validations/auth.validation';

export default function ForgotPassword() {
  const {
    mutateAsync: forgotPassword,
    isPending: isSendingForgotPassword,
    error: forgotPasswordError,
    isSuccess: forgotPasswordSuccess,
  } = useForgotPasswordMutation();
  const [emailFocused, setEmailFocused] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (values: ForgotPasswordFormValues) => {
    try {
      await forgotPassword(values.email);
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

      {/* Background image layer */}
      <div
        aria-hidden="true"
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1618773928121-c32242e63f39?q=80&w=2070&auto=format&fit=crop')",
        }}
      />
      {/* Light overlay keeps the glass card and brand logo legible */}
      <div
        aria-hidden="true"
        className="absolute inset-0 z-0 bg-linear-to-b from-surface/85 via-surface/65 to-surface/85"
      />

      <main className="relative z-10 w-full max-w-md">
        <div className="text-center mb-stack-lg">
          <Link
            to="/"
            className="inline-block hover:opacity-90 transition-opacity"
          >
            <h1 className="font-display-lg text-3xl font-extrabold tracking-widest uppercase text-transparent bg-clip-text bg-linear-to-r from-secondary via-secondary-fixed-dim to-secondary text-glow">
              Smart Stay AI
            </h1>
          </Link>
        </div>

        <div
          className="glass-card w-full p-stack-lg rounded-[16px] shadow-[0_20px_40px_rgba(0,0,0,0.08)] duration-700"
          style={{
            transform: emailFocused ? 'scale(1.01)' : 'scale(1)',
            transition:
              'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          }}
        >
          <div className="text-center mb-stack-lg">
            <h2 className="font-headline-lg-mobile text-headline-lg-mobile md:font-headline-lg md:text-headline-lg text-on-surface mb-stack-sm font-semibold">
              Reset Your Password
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-70 mx-auto">
              Enter your email address and we'll send you a link to reset your
              password.
            </p>
          </div>

          {forgotPasswordSuccess ? (
            <div className="bg-green-800/10 border border-green-800/20 text-green-700 p-4 rounded-xl text-center font-body-md flex flex-col items-center">
              <span className="material-symbols-outlined text-green-800 text-4xl mb-2">
                mark_email_read
              </span>
              <p className="font-semibold">Reset Link Sent!</p>
              <p className="text-sm mt-1">
                If this email is registered, we have sent a password reset link
                to it. Please check your inbox.
              </p>
            </div>
          ) : (
            <form
              className="space-y-stack-md"
              onSubmit={handleSubmit(onSubmit)}
            >
              {forgotPasswordError && (
                <div className="bg-error/10 border border-error/20 text-error p-3 rounded-xl text-sm font-semibold">
                  {(forgotPasswordError as any)?.response?.data?.message ||
                    'Failed to send recovery email. Please try again.'}
                </div>
              )}

              <div>
                <Label
                  className="block font-label-lg text-label-lg text-on-surface-variant mb-2"
                  htmlFor="email"
                >
                  Email Address
                </Label>
                <Input
                  {...register('email')}
                  className="w-full bg-primary-container border-none focus:ring-2 focus:ring-secondary/20 rounded-[16px] px-4 py-3 text-body-md text-on-surface placeholder:text-outline-variant transition-all duration-300 outline-none h-auto"
                  id="email"
                  placeholder="name@example.com"
                  type="email"
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
                />
                {errors.email && (
                  <p className="text-[10px] text-error font-semibold mt-1.5 px-1">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <Button
                className="w-full bg-primary text-on-primary font-label-lg text-label-lg py-4 rounded-[16px] hover:bg-primary/95 active:scale-[0.98] transition-all duration-200 shadow-sm flex items-center justify-center gap-2 group cursor-pointer outline-none border-none h-auto"
                type="submit"
                disabled={isSendingForgotPassword}
              >
                {isSendingForgotPassword
                  ? 'Sending Recovery Email...'
                  : 'Send Recovery Email'}
                {!isSendingForgotPassword && (
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

      {/* Subtle Premium Glow */}
      <div className="fixed bottom-0 right-0 w-[50vw] h-128 bg-secondary/5 blur-[120px] rounded-full pointer-events-none z-0"></div>
      <div className="fixed top-0 left-0 w-[30vw] h-76.75 bg-primary/5 blur-[100px] rounded-full pointer-events-none z-0"></div>
    </div>
  );
}
