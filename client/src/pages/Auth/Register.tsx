import { Link, useNavigate } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { useSendOtpMutation } from '../../hooks/auth';
import {
  registerSchema,
  type RegisterInput,
} from '../../validations/auth.validation';

export default function Register() {
  const navigate = useNavigate();
  const {
    mutateAsync: sendOtp,
    isPending: isSendingOtp,
    error: sendOtpError,
  } = useSendOtpMutation();

  const {
    register,
    handleSubmit: handleFormSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: RegisterInput) => {
    try {
      await sendOtp(data.email);
      navigate('/verify-identity', {
        state: {
          email: data.email,
          name: data.name,
          password: data.password,
        },
      });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="relative min-h-screen text-on-surface select-none overflow-hidden bg-background">
      <style>{`
        .glass-panel {
          background: rgba(245, 242, 238, 0.7);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
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
            "url('https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=2070&auto=format&fit=crop')",
        }}
      />
      {/* Light overlay keeps the glass panel and brand logo legible */}
      <div
        aria-hidden="true"
        className="absolute inset-0 z-0 bg-linear-to-b from-surface/85 via-surface/65 to-surface/85"
      />

      <main className="relative z-10 min-h-screen flex items-center justify-center px-margin-mobile py-stack-lg">
        <div className="w-full max-w-120">
          {/* Brand Logo Center */}
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

          <div className="glass-panel rounded-3xl p-stack-lg shadow-[0_4px_20px_rgba(26,26,26,0.04)] border border-white/20">
            <header className="text-center mb-stack-lg">
              <h2 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface mb-2">
                Create Account
              </h2>
              <p className="font-body-md text-body-md text-on-surface-variant">
                Experience the future of personal concierge services.
              </p>
            </header>

            <form
              className="space-y-stack-md"
              onSubmit={handleFormSubmit(onSubmit)}
            >
              {sendOtpError && (
                <div className="bg-error/10 border border-error/20 text-error p-3 rounded-xl text-sm font-semibold">
                  {(sendOtpError as any)?.response?.data?.message ||
                    'Failed to send OTP code. Please try again.'}
                </div>
              )}

              {/* Full Name */}
              <div className="space-y-2">
                <Label className="font-label-lg text-label-lg text-on-surface-variant uppercase">
                  Full Name
                </Label>
                <div className="relative">
                  <Input
                    {...register('name')}
                    className="w-full h-14 px-4 bg-surface-container-low/50 border-none rounded-xl font-body-md text-body-md focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-outline outline-none"
                    placeholder="John Doe"
                    type="text"
                  />
                </div>
                {errors.name && (
                  <p className="text-error text-xs font-semibold mt-1.5 ml-1">
                    {errors.name.message}
                  </p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label className="font-label-lg text-label-lg text-on-surface-variant uppercase">
                  Email Address
                </Label>
                <div className="relative">
                  <Input
                    {...register('email')}
                    className="w-full h-14 px-4 bg-surface-container-low/50 border-none rounded-xl font-body-md text-body-md focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-outline outline-none"
                    placeholder="name@example.com"
                    type="email"
                  />
                </div>
                {errors.email && (
                  <p className="text-error text-xs font-semibold mt-1.5 ml-1">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label className="font-label-lg text-label-lg text-on-surface-variant uppercase">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    {...register('password')}
                    className="w-full h-14 px-4 bg-surface-container-low/50 border-none rounded-xl font-body-md text-body-md focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-outline outline-none"
                    placeholder="••••••••"
                    type="password"
                  />
                </div>
                {errors.password && (
                  <p className="text-error text-xs font-semibold mt-1.5 ml-1">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label className="font-label-lg text-label-lg text-on-surface-variant uppercase">
                  Confirm Password
                </Label>
                <div className="relative">
                  <Input
                    {...register('confirmPassword')}
                    className="w-full h-14 px-4 bg-surface-container-low/50 border-none rounded-xl font-body-md text-body-md focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-outline outline-none"
                    placeholder="••••••••"
                    type="password"
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="text-error text-xs font-semibold mt-1.5 ml-1">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>

              <div className="pt-4">
                <Button
                  className="w-full h-14 bg-primary text-on-primary font-label-lg text-label-lg rounded-full shadow-lg hover:bg-primary/90 active:scale-95 transition-all flex items-center justify-center gap-2 group cursor-pointer outline-none border-none"
                  type="submit"
                  disabled={isSendingOtp}
                >
                  {isSendingOtp ? 'Sending OTP Code...' : 'Create Account'}
                  {!isSendingOtp && (
                    <span className="material-symbols-outlined text-[20px] group-hover:translate-x-1 transition-transform">
                      arrow_forward
                    </span>
                  )}
                </Button>
              </div>

              <div className="flex items-center gap-4 my-stack-md">
                <div className="h-px flex-1 bg-outline-variant/30"></div>
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">
                  or
                </span>
                <div className="h-px flex-1 bg-outline-variant/30"></div>
              </div>

              <div className="mt-4">
                <Button
                  className="w-full h-14 bg-surface-container-lowest border border-outline-variant/50 text-on-surface font-label-lg text-label-lg rounded-full shadow-sm hover:bg-surface-container-low active:scale-95 transition-all flex items-center justify-center gap-3 cursor-pointer outline-none"
                  type="button"
                  onClick={() => alert('Connecting with Google...')}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    ></path>
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    ></path>
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    ></path>
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    ></path>
                  </svg>
                  Register with Google
                </Button>
              </div>
            </form>

            <footer className="mt-stack-lg text-center space-y-4">
              <p className="font-body-md text-body-md text-on-surface-variant">
                Already have an account?{' '}
                <Link
                  className="text-on-surface font-semibold hover:underline transition-all"
                  to="/login"
                >
                  Login
                </Link>
              </p>
              <div className="flex items-center justify-center gap-6 pt-4 border-t border-outline-variant/30">
                <a
                  className="font-label-sm text-label-sm text-on-surface-variant uppercase hover:text-primary"
                  href="#legal"
                  onClick={e => {
                    e.preventDefault();
                    alert('Legal information...');
                  }}
                >
                  Legal
                </a>
                <a
                  className="font-label-sm text-label-sm text-on-surface-variant uppercase hover:text-primary"
                  href="#privacy"
                  onClick={e => {
                    e.preventDefault();
                    alert('Privacy policy...');
                  }}
                >
                  Privacy
                </a>
              </div>
            </footer>
          </div>
        </div>
      </main>
    </div>
  );
}
