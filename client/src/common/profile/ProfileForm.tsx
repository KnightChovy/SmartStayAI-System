import { useRef } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { BadgeCheck, Loader2, Upload } from 'lucide-react';
import { useUpdateProfile } from '@/hooks/account';
import { useUpload } from '@/hooks/use-upload';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/ui/date-picker';
import { toDateInputValue } from '@/utils/formatDate';
import { errorMessage } from '@/utils/errorMessage';
import {
  ACCOUNT_ERROR_KEYS,
  isAccountErrorCode,
  profileSchema,
  type ProfileFormValues,
} from '@/validations/account.validation';
import type { UserProfile } from '@/types/account.types';

/** Ngày sinh: không được là tương lai, không quá 120 năm về trước. */
const TODAY = toDateInputValue(new Date());
const MIN_DOB = toDateInputValue(
  new Date(new Date().getFullYear() - 120, 0, 1)
);

export function ProfileForm({ initial }: { initial: UserProfile }) {
  const { t } = useTranslation('account');
  const updateProfile = useUpdateProfile();
  const updateUser = useAuthStore(state => state.updateUser);
  const upload = useUpload();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitSuccessful, isDirty },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    // Báo lỗi ngay khi rời ô thay vì đợi bấm Lưu — khách sửa tại chỗ, không phải dò lại cả form.
    mode: 'onBlur',
    defaultValues: {
      fullName: initial.fullName,
      phone: initial.phone ?? '',
      avatarUrl: initial.avatarUrl ?? null,
      dateOfBirth: initial.dateOfBirth ?? '',
      nationality: initial.nationality ?? '',
      idCardNumber: initial.idCardNumber ?? '',
      passportNumber: initial.passportNumber ?? '',
      preferredLanguage: initial.preferredLanguage,
      preferredCurrency: initial.preferredCurrency,
      marketingOptIn: initial.marketingOptIn,
    },
  });

  /** Zod chỉ giữ được `string`, tra bảng để ra key i18n type-safe (mã lạ → không hiện gì). */
  const fieldError = (code?: string) =>
    code && isAccountErrorCode(code) ? t(ACCOUNT_ERROR_KEYS[code]) : null;

  // Avatar là field RHF thật (URL do `POST /uploads` trả về, khách không gõ tay) nên nó cũng
  // đi qua `isDirty`/`reset` như mọi field khác — đổi ảnh xong là nút Lưu phản ánh đúng.
  // Dùng `useWatch` (subscription) chứ không phải `watch()`: `watch()` trả hàm mới mỗi lần render
  // nên React Compiler bỏ qua memo hoá cả component (eslint `react-hooks/incompatible-library`).
  const currentAvatar = useWatch({ control, name: 'avatarUrl' });
  const watchedName = useWatch({ control, name: 'fullName' });

  const onPickAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { url } = await upload.mutateAsync({ file, folder: 'avatars' });
      setValue('avatarUrl', url, { shouldDirty: true });
    } catch (err) {
      toast.error(errorMessage(err, t('profile.uploadError')));
    }
  };

  const onSubmit = handleSubmit(async values => {
    // '' = khách xoá field ⇒ gửi null để BE xoá hẳn. Gửi '' thì Joi `Joi.string()` từ chối.
    const blankToNull = (v: string) => (v.trim() === '' ? null : v.trim());
    const patch: Partial<UserProfile> = {
      fullName: values.fullName.trim(),
      phone: blankToNull(values.phone),
      dateOfBirth: blankToNull(values.dateOfBirth),
      nationality: blankToNull(values.nationality),
      idCardNumber: blankToNull(values.idCardNumber),
      passportNumber: blankToNull(values.passportNumber),
      preferredLanguage: values.preferredLanguage,
      preferredCurrency: values.preferredCurrency,
      marketingOptIn: values.marketingOptIn,
      avatarUrl: values.avatarUrl,
    };

    try {
      await updateProfile.mutateAsync(patch);
    } catch (err) {
      // Trước đây `mutateAsync` không có catch và không nơi nào render `isError` ⇒ BE trả 400 là
      // màn hình im lặng hoàn toàn: không lỗi, không "Đã lưu". Khách bấm Lưu nhiều lần vô ích.
      toast.error(errorMessage(err, t('profile.saveError')));
      return;
    }

    // `authStore` chỉ được ghi lúc đăng nhập và không tự refresh, nên nếu không đồng bộ ở đây
    // thì mọi nơi đọc `user` (navbar, prefill form đặt phòng…) vẫn thấy dữ liệu cũ cho tới lần
    // đăng nhập kế tiếp — đúng nguyên nhân ô Phone ở trang đặt phòng bị trống.
    updateUser({
      fullName: patch.fullName ?? '',
      phone: patch.phone ?? null,
      avatarUrl: patch.avatarUrl ?? null,
    });
    // Reset về chính giá trị vừa lưu ⇒ form hết `dirty`, và cờ "Đã lưu!" tự tắt khi khách sửa tiếp.
    reset(values, { keepValues: true });
    toast.success(t('profile.saved'));
  });

  const initials = (watchedName || initial.email || 'US')
    .slice(0, 1)
    .toUpperCase();

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-6" noValidate>
      {/* Avatar */}
      <div className="flex items-center gap-4 rounded-2xl border border-outline-variant/30 bg-surface p-5">
        {currentAvatar ? (
          <img
            src={currentAvatar}
            alt=""
            className="size-16 rounded-full border object-cover"
          />
        ) : (
          <div className="flex size-16 items-center justify-center rounded-full bg-secondary-container text-xl font-bold text-on-secondary-container">
            {initials}
          </div>
        )}
        <div className="flex-1">
          <Label>{t('profile.photo')}</Label>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onPickAvatar}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={upload.isPending}
            >
              {upload.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Upload className="size-4" />
              )}
              {upload.isPending ? t('profile.uploading') : t('profile.upload')}
            </Button>
            {currentAvatar && (
              <Button
                type="button"
                variant="ghost"
                onClick={() =>
                  setValue('avatarUrl', null, { shouldDirty: true })
                }
              >
                {t('profile.remove')}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Basic info */}
      <div className="grid gap-4 rounded-2xl border border-outline-variant/30 bg-surface p-5 sm:grid-cols-2">
        <Field
          label={t('profile.fullName')}
          error={fieldError(errors.fullName?.message)}
        >
          <Input
            {...register('fullName')}
            maxLength={255}
            aria-invalid={!!errors.fullName}
            aria-required="true"
          />
        </Field>
        <Field
          label={t('profile.phone')}
          error={fieldError(errors.phone?.message)}
        >
          <Input
            {...register('phone')}
            type="tel"
            maxLength={20}
            aria-invalid={!!errors.phone}
          />
        </Field>
        <Field label={t('profile.email')} className="sm:col-span-2">
          <div className="flex items-center gap-2">
            <Input
              value={initial.email}
              readOnly
              className="bg-surface-container-low"
            />
            {initial.emailVerifiedAt && (
              <span className="flex shrink-0 items-center gap-1 text-xs font-semibold text-emerald-600">
                <BadgeCheck className="size-4" /> {t('profile.verified')}
              </span>
            )}
          </div>
        </Field>
        <Field
          label={t('profile.dob')}
          error={fieldError(errors.dateOfBirth?.message)}
        >
          <Controller
            control={control}
            name="dateOfBirth"
            render={({ field }) => (
              <DatePicker
                value={field.value}
                min={MIN_DOB}
                max={TODAY}
                placeholder={t('profile.dobPlaceholder')}
                onChange={v => field.onChange(v || '')}
                className="h-8 bg-surface"
              />
            )}
          />
        </Field>
        <Field
          label={t('profile.nationality')}
          error={fieldError(errors.nationality?.message)}
        >
          <Input
            {...register('nationality')}
            maxLength={100}
            aria-invalid={!!errors.nationality}
          />
        </Field>
        <Field
          label={t('profile.idCard')}
          error={fieldError(errors.idCardNumber?.message)}
        >
          <Input
            {...register('idCardNumber')}
            maxLength={50}
            aria-invalid={!!errors.idCardNumber}
          />
        </Field>
        <Field
          label={t('profile.passport')}
          error={fieldError(errors.passportNumber?.message)}
        >
          <Input
            {...register('passportNumber')}
            maxLength={50}
            aria-invalid={!!errors.passportNumber}
          />
        </Field>
      </div>

      {/* Preferences */}
      <div className="grid gap-4 rounded-2xl border border-outline-variant/30 bg-surface p-5 sm:grid-cols-2">
        <Field label={t('profile.preferredLanguage')}>
          <select
            {...register('preferredLanguage')}
            className="h-9 rounded-lg border border-outline-variant/40 bg-surface px-3 text-sm outline-none focus:border-primary"
          >
            <option value="vi">Tiếng Việt</option>
            <option value="en">English</option>
          </select>
        </Field>
        <Field label={t('profile.preferredCurrency')}>
          <select
            {...register('preferredCurrency')}
            className="h-9 rounded-lg border border-outline-variant/40 bg-surface px-3 text-sm outline-none focus:border-primary"
          >
            <option value="VND">VNĐ</option>
            <option value="USD">USD ($)</option>
          </select>
        </Field>
        <label className="flex items-center gap-2 sm:col-span-2">
          <input
            type="checkbox"
            {...register('marketingOptIn')}
            className="size-4 accent-primary"
          />
          <span className="text-sm text-on-surface-variant">
            {t('profile.marketingOptIn')}
          </span>
        </label>
      </div>

      <div className="flex items-center gap-3">
        <Button
          type="submit"
          size="lg"
          className="bg-on-surface text-white hover:bg-primary"
          disabled={updateProfile.isPending}
        >
          {updateProfile.isPending && (
            <Loader2 className="size-4 animate-spin" />
          )}
          {t('profile.saveChanges')}
        </Button>
        {isSubmitSuccessful && !isDirty && !updateProfile.isError && (
          <span className="text-sm font-medium text-emerald-600">
            {t('profile.saved')}
          </span>
        )}
      </div>
    </form>
  );
}

function Field({
  label,
  children,
  className,
  error,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
  error?: string | null;
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${className ?? ''}`}>
      <Label>{label}</Label>
      {children}
      {error && <p className="text-xs text-error">{error}</p>}
    </div>
  );
}
