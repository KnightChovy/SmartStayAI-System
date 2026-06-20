import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
  welcomeProfileSchema,
  type WelcomeProfileInput,
} from '../../validations/auth.validation';

interface WelcomeProfileModalProps {
  open: boolean;
  isSubmitting?: boolean;
  defaults: WelcomeProfileInput;
  onClose: () => void;
  onSubmit: (values: WelcomeProfileInput) => void;
}

const inputClass =
  'w-full h-14 px-5 bg-surface-container-low border border-outline-variant/60 rounded-xl font-body-md text-body-lg text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none placeholder:text-outline';

export default function WelcomeProfileModal({
  open,
  isSubmitting = false,
  defaults,
  onClose,
  onSubmit,
}: WelcomeProfileModalProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<WelcomeProfileInput>({
    resolver: zodResolver(welcomeProfileSchema),
    defaultValues: defaults,
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative z-10 w-full sm:w-2/3 max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl bg-surface shadow-2xl">
        <div className="px-10 pt-10 pb-6 border-b border-outline-variant/20">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-headline-lg-mobile text-3xl sm:text-4xl font-semibold text-on-surface">
                Welcome to SmartStay! 🎉
              </h2>
              <p className="text-base sm:text-lg text-on-surface-variant mt-2">
                Confirm your details so we can personalize your stays.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="shrink-0 flex items-center justify-center text-on-surface-variant hover:text-on-surface p-2 rounded-full hover:bg-surface-container-low transition-colors"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="px-10 py-8 space-y-6">
          <div>
            <Label className="font-label-sm text-label-sm text-on-surface-variant block mb-2 uppercase">
              Full name
            </Label>
            <Input
              {...register('fullName')}
              className={inputClass}
              placeholder="John Doe"
              type="text"
            />
            {errors.fullName && (
              <p className="text-error text-xs font-semibold mt-1.5 ml-1">
                {errors.fullName.message}
              </p>
            )}
          </div>

          <div>
            <Label className="font-label-sm text-label-sm text-on-surface-variant block mb-2 uppercase">
              Email
            </Label>
            <Input
              {...register('email')}
              className={`${inputClass} bg-surface-container-low/60`}
              type="email"
              readOnly
            />
            {errors.email && (
              <p className="text-error text-xs font-semibold mt-1.5 ml-1">
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <Label className="font-label-sm text-label-sm text-on-surface-variant block mb-2 uppercase">
              Phone number
            </Label>
            <Input
              {...register('phone')}
              className={inputClass}
              placeholder="+84 912 345 678"
              type="tel"
            />
            {errors.phone && (
              <p className="text-error text-xs font-semibold mt-1.5 ml-1">
                {errors.phone.message}
              </p>
            )}
          </div>

          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4">
            <Button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 h-14 text-base rounded-full bg-surface-container-low text-on-surface hover:bg-surface-container border-none"
            >
              Maybe later
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 h-14 text-base rounded-full bg-black text-white hover:bg-black/90 border-none"
            >
              {isSubmitting ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
