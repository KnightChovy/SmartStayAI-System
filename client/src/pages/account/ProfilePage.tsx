import { useRef, useState } from 'react';
import { BadgeCheck, Loader2, Upload } from 'lucide-react';
import { useProfile, useUpdateProfile } from '@/hooks/account';
import { useUpload } from '@/hooks/use-upload';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import type { UserProfile } from '@/types/account.types';

export default function ProfilePage() {
  const user = useAuthStore(state => state.user);
  const seed: Partial<UserProfile> = {
    fullName: user?.fullName ?? '',
    email: user?.email ?? '',
    phone: user?.phone ?? '',
    avatarUrl: user?.avatarUrl ?? null,
    emailVerifiedAt: user?.emailVerifiedAt ?? null,
  };

  const { data: profile } = useProfile(seed);

  return (
    <div>
      <h2 className="font-be-vietnam text-2xl font-bold text-on-surface">Profile</h2>
      <p className="mt-1 text-sm text-on-surface-variant">Manage your personal information.</p>

      {profile ? (
        <ProfileForm initial={profile} />
      ) : (
        <Skeleton className="mt-6 h-96 w-full rounded-2xl" />
      )}
    </div>
  );
}

/** Form khởi tạo state đồng bộ từ `initial` (không cần useEffect đồng bộ). */
function ProfileForm({ initial }: { initial: UserProfile }) {
  const updateProfile = useUpdateProfile();
  const upload = useUpload();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<UserProfile>(initial);
  console.log('🚀 ~ file: ProfilePage.tsx:49 ~ ProfileForm ~ form:', form);
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
    setSaved(true);
  };

  const initials = (form.fullName || form.email || 'US').slice(0, 2).toUpperCase();

  return (
    <form onSubmit={onSave} className="mt-6 space-y-6">
      {/* Avatar */}
      <div className="flex items-center gap-4 rounded-2xl border border-outline-variant/30 bg-surface p-5">
        {form.avatarUrl ? (
          <img src={form.avatarUrl} alt="" className="size-16 rounded-full border object-cover" />
        ) : (
          <div className="flex size-16 items-center justify-center rounded-full bg-secondary-container text-xl font-bold text-on-secondary-container">
            {initials}
          </div>
        )}
        <div className="flex-1">
          <Label>Profile photo</Label>
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
              {upload.isPending ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
              {upload.isPending ? 'Uploading…' : 'Upload photo'}
            </Button>
            {form.avatarUrl && (
              <Button type="button" variant="ghost" onClick={() => set('avatarUrl', null)}>
                Remove
              </Button>
            )}
          </div>
          {upload.isError && <p className="mt-1 text-xs text-error">Upload failed. Try another image.</p>}
        </div>
      </div>

      {/* Basic info */}
      <div className="grid gap-4 rounded-2xl border border-outline-variant/30 bg-surface p-5 sm:grid-cols-2">
        <Field label="Full name">
          <Input value={form.fullName} onChange={e => set('fullName', e.target.value)} />
        </Field>
        <Field label="Phone">
          <Input value={form.phone ?? ''} onChange={e => set('phone', e.target.value)} />
        </Field>
        <Field label="Email" className="sm:col-span-2">
          <div className="flex items-center gap-2">
            <Input value={form.email} readOnly className="bg-surface-container-low" />
            {form.emailVerifiedAt && (
              <span className="flex shrink-0 items-center gap-1 text-xs font-semibold text-emerald-600">
                <BadgeCheck className="size-4" /> Verified
              </span>
            )}
          </div>
        </Field>
        <Field label="Date of birth">
          <Input
            type="date"
            value={form.dateOfBirth ?? ''}
            onChange={e => set('dateOfBirth', e.target.value)}
          />
        </Field>
        <Field label="Nationality">
          <Input value={form.nationality ?? ''} onChange={e => set('nationality', e.target.value)} />
        </Field>
        <Field label="ID card number">
          <Input value={form.idCardNumber ?? ''} onChange={e => set('idCardNumber', e.target.value)} />
        </Field>
        <Field label="Passport number">
          <Input value={form.passportNumber ?? ''} onChange={e => set('passportNumber', e.target.value)} />
        </Field>
      </div>

      {/* Preferences */}
      <div className="grid gap-4 rounded-2xl border border-outline-variant/30 bg-surface p-5 sm:grid-cols-2">
        <Field label="Preferred language">
          <select
            value={form.preferredLanguage}
            onChange={e => set('preferredLanguage', e.target.value as 'vi' | 'en')}
            className="h-9 rounded-lg border border-outline-variant/40 bg-surface px-3 text-sm outline-none focus:border-primary"
          >
            <option value="vi">Tiếng Việt</option>
            <option value="en">English</option>
          </select>
        </Field>
        <Field label="Preferred currency">
          <select
            value={form.preferredCurrency}
            onChange={e => set('preferredCurrency', e.target.value as 'VND' | 'USD')}
            className="h-9 rounded-lg border border-outline-variant/40 bg-surface px-3 text-sm outline-none focus:border-primary"
          >
            <option value="VND">VND (₫)</option>
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
            Send me deals and personalized recommendations
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
          {updateProfile.isPending && <Loader2 className="size-4 animate-spin" />}
          Save changes
        </Button>
        {saved && <span className="text-sm font-medium text-emerald-600">Saved!</span>}
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
