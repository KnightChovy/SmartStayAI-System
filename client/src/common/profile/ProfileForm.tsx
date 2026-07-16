import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BadgeCheck, Loader2, Upload } from 'lucide-react';
import { useUpdateProfile } from '@/hooks/account';
import { useUpload } from '@/hooks/use-upload';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/ui/date-picker';
import { toDateInputValue } from '@/utils/formatDate';
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
  const [form, setForm] = useState<UserProfile>(initial);
  const [saved, setSaved] = useState(false);

  const set = <K extends keyof UserProfile>(key: K, value: UserProfile[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const onPickAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const { url } = await upload.mutateAsync({ file, folder: 'avatars' });
    set('avatarUrl', url);
  };

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfile.mutateAsync(form);
    // `authStore` chỉ được ghi lúc đăng nhập và không tự refresh, nên nếu không đồng bộ ở đây
    // thì mọi nơi đọc `user` (navbar, prefill form đặt phòng…) vẫn thấy dữ liệu cũ cho tới lần
    // đăng nhập kế tiếp — đúng nguyên nhân ô Phone ở trang đặt phòng bị trống.
    updateUser({
      fullName: form.fullName,
      phone: form.phone ?? null,
      avatarUrl: form.avatarUrl ?? null,
    });
    setSaved(true);
  };

  const initials = (form.fullName || form.email || 'US')
    .slice(0, 1)
    .toUpperCase();

  return (
    <form onSubmit={onSave} className="mt-6 space-y-6">
      {/* Avatar */}
      <div className="flex items-center gap-4 rounded-2xl border border-outline-variant/30 bg-surface p-5">
        {form.avatarUrl ? (
          <img
            src={form.avatarUrl}
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
            {form.avatarUrl && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => set('avatarUrl', null)}
              >
                {t('profile.remove')}
              </Button>
            )}
          </div>
          {upload.isError && (
            <p className="mt-1 text-xs text-error">
              {t('profile.uploadError')}
            </p>
          )}
        </div>
      </div>

      {/* Basic info */}
      <div className="grid gap-4 rounded-2xl border border-outline-variant/30 bg-surface p-5 sm:grid-cols-2">
        <Field label={t('profile.fullName')}>
          <Input
            value={form.fullName}
            onChange={e => set('fullName', e.target.value)}
          />
        </Field>
        <Field label={t('profile.phone')}>
          <Input
            value={form.phone ?? ''}
            onChange={e => set('phone', e.target.value)}
          />
        </Field>
        <Field label={t('profile.email')} className="sm:col-span-2">
          <div className="flex items-center gap-2">
            <Input
              value={form.email}
              readOnly
              className="bg-surface-container-low"
            />
            {form.emailVerifiedAt && (
              <span className="flex shrink-0 items-center gap-1 text-xs font-semibold text-emerald-600">
                <BadgeCheck className="size-4" /> {t('profile.verified')}
              </span>
            )}
          </div>
        </Field>
        <Field label={t('profile.dob')}>
          <DatePicker
            value={form.dateOfBirth ?? ''}
            min={MIN_DOB}
            max={TODAY}
            placeholder={t('profile.dobPlaceholder')}
            onChange={v => set('dateOfBirth', v || null)}
            className="h-8 bg-surface"
          />
        </Field>
        <Field label={t('profile.nationality')}>
          <Input
            value={form.nationality ?? ''}
            onChange={e => set('nationality', e.target.value)}
          />
        </Field>
        <Field label={t('profile.idCard')}>
          <Input
            value={form.idCardNumber ?? ''}
            onChange={e => set('idCardNumber', e.target.value)}
          />
        </Field>
        <Field label={t('profile.passport')}>
          <Input
            value={form.passportNumber ?? ''}
            onChange={e => set('passportNumber', e.target.value)}
          />
        </Field>
      </div>

      {/* Preferences */}
      <div className="grid gap-4 rounded-2xl border border-outline-variant/30 bg-surface p-5 sm:grid-cols-2">
        <Field label={t('profile.preferredLanguage')}>
          <select
            value={form.preferredLanguage}
            onChange={e =>
              set('preferredLanguage', e.target.value as 'vi' | 'en')
            }
            className="h-9 rounded-lg border border-outline-variant/40 bg-surface px-3 text-sm outline-none focus:border-primary"
          >
            <option value="vi">Tiếng Việt</option>
            <option value="en">English</option>
          </select>
        </Field>
        <Field label={t('profile.preferredCurrency')}>
          <select
            value={form.preferredCurrency}
            onChange={e =>
              set('preferredCurrency', e.target.value as 'VND' | 'USD')
            }
            className="h-9 rounded-lg border border-outline-variant/40 bg-surface px-3 text-sm outline-none focus:border-primary"
          >
            <option value="VND">VNĐ</option>
            <option value="USD">USD ($)</option>
          </select>
        </Field>
        <label className="flex items-center gap-2 sm:col-span-2">
          <input
            type="checkbox"
            checked={form.marketingOptIn}
            onChange={e => set('marketingOptIn', e.target.checked)}
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
        {saved && (
          <span className="text-sm font-medium text-emerald-600">{t('profile.saved')}</span>
        )}
      </div>
    </form>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${className ?? ''}`}>
      <Label>{label}</Label>
      {children}
    </div>
  );
}
