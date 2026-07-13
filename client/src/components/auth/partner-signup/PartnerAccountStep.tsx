import { Link } from 'react-router';
import type { FieldErrors, UseFormRegister } from 'react-hook-form';
import { ArrowRight, Loader2, Lock, Mail, User as UserIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ROUTES } from '@/constants/routes';
import type { RegisterInput } from '@/validations/auth.validation';
import { Field, PwToggle, partnerFieldClass } from './fields';

interface PartnerAccountStepProps {
  register: UseFormRegister<RegisterInput>;
  errors: FieldErrors<RegisterInput>;
  onContinue: () => void;
  isSubmitting: boolean;
  apiError: string | null;
  showPassword: boolean;
  setShowPassword: (v: boolean) => void;
  showConfirm: boolean;
  setShowConfirm: (v: boolean) => void;
}

/** Bước 1 — thông tin tài khoản (tạo user thường: tên, email, mật khẩu). */
export function PartnerAccountStep({
  register,
  errors,
  onContinue,
  isSubmitting,
  apiError,
  showPassword,
  setShowPassword,
  showConfirm,
  setShowConfirm,
}: PartnerAccountStepProps) {
  return (
    <section className="space-y-4">
      <header className="mb-2">
        <h2 className="text-2xl font-bold text-on-surface mb-1.5">
          Create your partner account
        </h2>
        <p className="text-sm text-on-surface-variant">
          Already have an account?{' '}
          <Link
            to={ROUTES.login}
            className="font-semibold text-role-partner-primary hover:underline"
          >
            Sign in
          </Link>
        </p>
      </header>

      {apiError && (
        <div className="bg-error/10 border border-error/20 text-error p-3 rounded-xl text-sm font-semibold">
          {apiError}
        </div>
      )}

      <Field
        label="Full name"
        icon={<UserIcon className="w-4 h-4" />}
        required
        error={errors.name?.message}
      >
        <Input
          {...register('name')}
          placeholder="e.g. Nguyen Van An"
          className={partnerFieldClass}
        />
      </Field>

      <Field
        label="Email"
        icon={<Mail className="w-4 h-4" />}
        required
        error={errors.email?.message}
      >
        <Input
          {...register('email')}
          type="email"
          placeholder="name@example.com"
          className={partnerFieldClass}
        />
      </Field>

      <Field
        label="Password"
        icon={<Lock className="w-4 h-4" />}
        required
        error={errors.password?.message}
      >
        <div className="relative">
          <Input
            {...register('password')}
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            className={`${partnerFieldClass} pr-11`}
          />
          <PwToggle
            shown={showPassword}
            onClick={() => setShowPassword(!showPassword)}
          />
        </div>
      </Field>

      <Field
        label="Confirm password"
        icon={<Lock className="w-4 h-4" />}
        required
        error={errors.confirmPassword?.message}
      >
        <div className="relative">
          <Input
            {...register('confirmPassword')}
            type={showConfirm ? 'text' : 'password'}
            placeholder="••••••••"
            className={`${partnerFieldClass} pr-11`}
          />
          <PwToggle
            shown={showConfirm}
            onClick={() => setShowConfirm(!showConfirm)}
          />
        </div>
      </Field>

      <Button
        type="button"
        onClick={onContinue}
        disabled={isSubmitting}
        className="w-full h-12 bg-role-partner-primary hover:bg-role-partner-secondary text-white font-semibold rounded-xl shadow-lg shadow-role-partner-primary/20 cursor-pointer group"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending code...
          </>
        ) : (
          <>
            Continue
            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </>
        )}
      </Button>

      <p className="text-center text-sm text-on-surface-variant pt-1">
        Just want to book stays?{' '}
        <Link
          to={ROUTES.register}
          className="font-semibold text-role-partner-primary hover:underline"
        >
          Create a traveler account
        </Link>
      </p>
    </section>
  );
}
