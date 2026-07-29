import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { useChangePassword } from '@/hooks/account';
import { errorMessage } from '@/utils/errorMessage';
import {
  PASSWORD_ERROR_KEYS,
  changePasswordSchema,
  isPasswordErrorCode,
} from '@/validations/account.validation';
import type { ChangePasswordFormValues } from '@/validations/account.validation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

/**
 * Cài đặt tài khoản. Hiện chỉ có đổi mật khẩu (`PATCH /users/me/password`).
 * Khối "phiên đăng nhập" + "xoá tài khoản" đã gỡ: BE không có endpoint nào cho
 * hai việc đó nên UI cũ chỉ là dữ liệu bịa / nút không làm gì.
 */
export default function AccountSettingsPage() {
  const { t } = useTranslation('account');
  const changePassword = useChangePassword();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  /** Mã lỗi zod → chữ đã dịch; mã lạ thì không hiện gì thay vì in mã thô ra màn hình. */
  const fieldError = (code?: string) =>
    code && isPasswordErrorCode(code) ? t(PASSWORD_ERROR_KEYS[code]) : null;

  const onSubmit = (values: ChangePasswordFormValues) => {
    changePassword.mutate(
      { currentPassword: values.currentPassword, newPassword: values.newPassword },
      {
        onSuccess: () => {
          toast.success(t('settings.passwordUpdated'));
          reset();
        },
        // BE trả message cụ thể ("Mật khẩu hiện tại không đúng", "Mật khẩu mới phải khác…") — hiện nguyên văn.
        onError: err => toast.error(errorMessage(err, t('settings.passwordError'))),
      }
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-be-vietnam text-2xl font-bold text-on-surface">{t('settings.title')}</h2>
        <p className="mt-1 text-sm text-on-surface-variant">{t('settings.subtitle')}</p>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-4 rounded-2xl border border-outline-variant/30 bg-surface p-5"
      >
        <div>
          <h3 className="font-be-vietnam font-semibold text-on-surface">
            {t('settings.changePassword')}
          </h3>
          <p className="mt-1 text-xs text-on-surface-variant">{t('settings.passwordHint')}</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="currentPassword">{t('settings.current')}</Label>
            <Input
              id="currentPassword"
              type="password"
              autoComplete="current-password"
              aria-invalid={!!errors.currentPassword}
              {...register('currentPassword')}
            />
            {errors.currentPassword && (
              <p className="text-xs text-error">{fieldError(errors.currentPassword.message)}</p>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="newPassword">{t('settings.new')}</Label>
            <Input
              id="newPassword"
              type="password"
              autoComplete="new-password"
              aria-invalid={!!errors.newPassword}
              {...register('newPassword')}
            />
            {errors.newPassword && (
              <p className="text-xs text-error">{fieldError(errors.newPassword.message)}</p>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="confirmPassword">{t('settings.confirm')}</Label>
            <Input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              aria-invalid={!!errors.confirmPassword}
              {...register('confirmPassword')}
            />
            {errors.confirmPassword && (
              <p className="text-xs text-error">{fieldError(errors.confirmPassword.message)}</p>
            )}
          </div>
        </div>

        <Button
          type="submit"
          disabled={changePassword.isPending}
          className="bg-on-surface text-white hover:bg-primary"
        >
          {changePassword.isPending && <Loader2 className="size-4 animate-spin" />}
          {t('settings.updatePassword')}
        </Button>
      </form>
    </div>
  );
}
