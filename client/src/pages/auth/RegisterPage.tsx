import { Link, useNavigate } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { useSendOtp } from '../../hooks/auth';
import {
  registerSchema,
  type RegisterInput,
} from '../../validations/auth.validation';

export default function RegisterPage() {
  const navigate = useNavigate();
  const {
    mutateAsync: sendOtp,
    isPending: isSendingOtp,
    error: sendOtpError,
  } = useSendOtp();

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
    <div className="relative min-h-screen text-on-surface select-none overflow-hidden grid md:grid-cols-2 bg-background">
      <style>{`
        .material-symbols-outlined {
          font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
      `}</style>

      {/* Left image panel */}
      <div
        className="relative hidden md:flex flex-col justify-between p-10 min-h-screen bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=2070&auto=format&fit=crop')",
          }}
        >
          {/* Dark overlay keeps the logo and tagline legible on the photo */}
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-linear-to-t from-black/70 via-black/25 to-black/40"
          />
          {/* Top row: logo + back to website */}
          <div className="relative z-10 flex items-center justify-between">
            <h1 className="font-display-lg text-xl font-extrabold tracking-widest uppercase text-white">
              SMART STAY AI
            </h1>
            <Link
              to="/"
              className="flex items-center gap-1 px-4 py-2 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 text-white font-label-sm text-label-sm hover:bg-white/25 transition-colors"
            >
              Back to website
              <span className="material-symbols-outlined text-[18px]">
                arrow_forward
              </span>
            </Link>
          </div>
          {/* Bottom: tagline + carousel dots */}
          <div className="relative z-10">
            <h2 className="font-headline-lg text-headline-lg text-white max-w-xs">
              Capturing Moments, Creating Memories
            </h2>
            <div className="mt-6 flex items-center gap-2">
              <span className="h-1.5 w-4 rounded-full bg-white/40" />
              <span className="h-1.5 w-4 rounded-full bg-white/40" />
              <span className="h-1.5 w-8 rounded-full bg-white" />
            </div>
          </div>
        </div>

      {/* Right form panel */}
      <div className="min-h-screen flex flex-col justify-center px-margin-mobile md:px-16 lg:px-24 py-stack-lg overflow-y-auto">
        <div className="w-full max-w-md mx-auto">
          <header className="mb-stack-lg">
            <h2 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface mb-stack-sm">
              Create an account
            </h2>
            {/* Sign in / Sign up segmented toggle */}
            <div className="flex p-1 bg-surface-container-low rounded-full">
              <Link
                to="/login"
                className="flex-1 text-center py-2.5 rounded-full font-label-lg text-label-lg text-on-surface-variant hover:text-on-surface transition-colors"
              >
                Sign In
              </Link>
              <span className="flex-1 text-center py-2.5 rounded-full font-label-lg text-label-lg bg-surface text-on-surface shadow-sm">
                Sign Up
              </span>
            </div>
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
                  Or register with
                </span>
                <div className="h-px flex-1 bg-outline-variant/30"></div>
              </div>

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
            </form>
 <p className="font-body-md text-body-md text-on-surface-variant">
              Already have an account?{' '}
              <Link
                className="text-secondary font-semibold hover:underline transition-all"
                to="/login"
              >
                Log in
              </Link>
            </p>
            <div className="mt-stack-md pt-4 border-t border-outline-variant/30 flex items-center justify-center gap-6">
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
          </div>
        </div>
      </div>
  );
}
