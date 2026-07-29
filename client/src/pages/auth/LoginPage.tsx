import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { useLogin } from '../../hooks/auth';
import { getLandingPathForRole } from '@/constants/roles';

import {
  loginSchema,
  type LoginInput,
} from '../../validations/auth.validation';

interface LoginRedirectState {
  from?: { pathname?: string; search?: string };
  booking?: unknown;
}

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation('auth');
  const redirect = (location.state as LoginRedirectState | null) ?? {};
  const {
    mutateAsync: login,
    isPending: isLoggingIn,
    error: loginError,
  } = useLogin();
  const [showPassword, setShowPassword] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const {
    register,
    handleSubmit: handleFormSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const onSubmit = async (data: LoginInput) => {
    try {
      const result = await login({
        email: data.email,
        password: data.password,
      });

      const fromPath = redirect.from?.pathname
        ? `${redirect.from.pathname}${redirect.from.search ?? ''}`
        : getLandingPathForRole(result?.user?.role);
      navigate(fromPath, { replace: true, state: redirect.booking });
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
            "url('https://images.unsplash.com/photo-1611892440504-42a792e24d32?q=80&w=2070&auto=format&fit=crop')",
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
            StayHub
          </h1>
          <Link
            to="/"
            className="flex items-center gap-1 px-4 py-2 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 text-white font-label-sm text-label-sm hover:bg-white/25 transition-colors"
          >
            {t('login.backToWebsite')}
            <span className="material-symbols-outlined text-[18px]">
              arrow_forward
            </span>
          </Link>
        </div>
        {/* Bottom: tagline + carousel dots */}
        <div className="relative z-10">
          <h2 className="font-headline-lg text-headline-lg text-white max-w-xs">
            {t('login.tagline')}
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
        <div className="w-full max-w-sm mx-auto">
          <div className="mb-stack-lg">
            <h2 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface mb-stack-sm font-semibold">
              {t('login.welcome')}
            </h2>
            {/* Sign in / Sign up segmented toggle */}
            <div className="flex p-1 bg-surface-container-low rounded-full">
              <span className="flex-1 text-center py-2.5 rounded-full font-label-lg text-label-lg bg-surface text-on-surface shadow-sm">
                {t('login.signIn')}
              </span>
              <Link
                to="/register"
                className="flex-1 text-center py-2.5 rounded-full font-label-lg text-label-lg text-on-surface-variant hover:text-on-surface transition-colors"
              >
                {t('login.signUp')}
              </Link>
            </div>
          </div>

          {/* Form */}
          <form
            className="space-y-stack-md"
            onSubmit={handleFormSubmit(onSubmit)}
          >
            {loginError && (
              <div className="bg-error/10 border border-error/20 text-error p-3 rounded-xl text-sm font-semibold">
                {(loginError as any)?.response?.data?.message ||
                  t('login.error')}
              </div>
            )}

            {/* Email Container */}
            <div
              style={{
                transform: emailFocused
                  ? 'translateY(-2px)'
                  : 'translateY(0px)',
                transition: 'transform 0.3s ease',
              }}
            >
              <Label
                className="font-label-sm text-label-sm text-on-surface-variant block mb-stack-sm uppercase"
                htmlFor="email"
              >
                {t('login.email')}
              </Label>
              <Input
                {...register('email')}
                className="w-full bg-surface-container-low border border-outline-variant/60 rounded-xl h-12 px-4 font-body-md text-body-md text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                id="email"
                placeholder="name@example.com"
                type="email"
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
              />
              {errors.email && (
                <p className="text-error text-xs font-semibold mt-1.5 ml-1">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div
              style={{
                transform: passwordFocused
                  ? 'translateY(-2px)'
                  : 'translateY(0px)',
                transition: 'transform 0.3s ease',
              }}
            >
              <div className="flex justify-between items-center mb-stack-sm">
                <Label
                  className="font-label-sm text-label-sm text-on-surface-variant uppercase"
                  htmlFor="password"
                >
                  {t('login.password')}
                </Label>
                <Link
                  className="font-label-sm text-label-sm text-secondary hover:text-on-secondary-container transition-colors"
                  to="/forgot-password"
                >
                  {t('login.forgotPassword')}
                </Link>
              </div>
              <div className="relative">
                <Input
                  {...register('password')}
                  className="w-full bg-surface-container-low border border-outline-variant/60 rounded-xl h-12 pl-4 pr-12 font-body-md text-body-md text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                  id="password"
                  placeholder="••••••••"
                  type={showPassword ? 'text' : 'password'}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                />
                <button
                  className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center justify-center text-on-surface-variant/60 hover:text-on-surface transition-colors cursor-pointer outline-none bg-transparent border-none p-0"
                  type="button"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={togglePasswordVisibility}
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
              {errors.password && (
                <p className="text-error text-xs font-semibold mt-1.5 ml-1">
                  {errors.password.message}
                </p>
              )}
            </div>

            <Button
              className="w-full  font-label-lg text-label-lg py-3.5 rounded-full shadow-lg hover:bg-primary/90 active:scale-[0.98] transition-all mt-stack-md uppercase tracking-widest cursor-pointer outline-none border-none h-auto bg-black text-white "
              type="submit"
              disabled={isLoggingIn}
            >
              {isLoggingIn ? t('login.submitting') : t('login.submit')}
            </Button>
          </form>

          <div className="relative flex items-center py-stack-md">
            <div className="grow border-t border-outline-variant/30"></div>
            <span className="shrink mx-4 font-label-sm text-label-sm text-outline uppercase tracking-widest">
              {t('login.orLoginWith')}
            </span>
            <div className="grow border-t border-outline-variant/30"></div>
          </div>

          <Button
            className="w-full h-12 bg-surface-container-lowest border border-outline-variant/50 text-on-surface font-label-lg text-label-lg rounded-full shadow-sm hover:bg-surface-container-low active:scale-95 transition-all flex items-center justify-center gap-3 cursor-pointer outline-none"
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
            {t('login.google')}
          </Button>
          <p className="font-body-md text-body-md text-on-surface-variant mt-5">
            {t('login.noAccount')}{' '}
            <Link
              className="text-secondary font-semibold hover:underline transition-all"
              to="/register"
            >
              {t('login.registerLink')}
            </Link>
          </p>

          <div className="mt-stack-md pt-4 border-t border-outline-variant/30 flex items-center justify-center gap-6">
            <a
              className="font-label-sm text-label-sm text-on-surface-variant uppercase hover:text-primary tracking-widest outline-none cursor-pointer"
              href="#legal"
              onClick={e => {
                e.preventDefault();
                alert('Legal info...');
              }}
            >
              {t('login.legal')}
            </a>
            <a
              className="font-label-sm text-label-sm text-on-surface-variant uppercase hover:text-primary tracking-widest outline-none cursor-pointer"
              href="#privacy"
              onClick={e => {
                e.preventDefault();
                alert('Privacy policy...');
              }}
            >
              {t('login.privacy')}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
