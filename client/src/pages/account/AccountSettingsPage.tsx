import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Laptop, Smartphone, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

/** [MOCK] Cài đặt tài khoản: đổi mật khẩu, thiết bị đăng nhập, xóa tài khoản. */
const MOCK_DEVICES = [
  { id: 'd1', name: 'Chrome · macOS', location: 'Da Nang, VN', current: true, icon: Laptop },
  { id: 'd2', name: 'StayHub App · iPhone', location: 'Ha Noi, VN', current: false, icon: Smartphone },
];

export default function AccountSettingsPage() {
  const { t } = useTranslation('account');
  const [pwSaved, setPwSaved] = useState(false);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-be-vietnam text-2xl font-bold text-on-surface">{t('settings.title')}</h2>
        <p className="mt-1 text-sm text-on-surface-variant">{t('settings.subtitle')}</p>
      </div>

      {/* Change password */}
      <form
        onSubmit={e => {
          e.preventDefault();
          setPwSaved(true);
        }}
        className="space-y-4 rounded-2xl border border-outline-variant/30 bg-surface p-5"
      >
        <h3 className="font-be-vietnam font-semibold text-on-surface">{t('settings.changePassword')}</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="current">{t('settings.current')}</Label>
            <Input id="current" type="password" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="new">{t('settings.new')}</Label>
            <Input id="new" type="password" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="confirm">{t('settings.confirm')}</Label>
            <Input id="confirm" type="password" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button type="submit" className="bg-on-surface text-white hover:bg-primary">
            {t('settings.updatePassword')}
          </Button>
          {pwSaved && <span className="text-sm text-emerald-600">{t('settings.passwordUpdated')}</span>}
        </div>
      </form>

      {/* Devices */}
      <div className="rounded-2xl border border-outline-variant/30 bg-surface p-5">
        <h3 className="font-be-vietnam font-semibold text-on-surface">{t('settings.activeSessions')}</h3>
        <ul className="mt-4 space-y-3">
          {MOCK_DEVICES.map(({ id, name, location, current, icon: Icon }) => (
            <li key={id} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-surface-container-low text-on-surface-variant">
                  <Icon className="size-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-on-surface">
                    {name}
                    {current && (
                      <span className="ml-2 rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-semibold text-emerald-600">
                        {t('settings.thisDevice')}
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-on-surface-variant">{location}</p>
                </div>
              </div>
              {!current && (
                <Button variant="outline" size="sm">
                  {t('settings.signOut')}
                </Button>
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* Danger zone */}
      <div className="rounded-2xl border border-error/30 bg-error/5 p-5">
        <h3 className="font-be-vietnam font-semibold text-error">{t('settings.deleteTitle')}</h3>
        <p className="mt-1 text-sm text-on-surface-variant">
          {t('settings.deleteDesc')}
        </p>
        <Button variant="destructive" className="mt-4">
          <Trash2 className="size-4" /> {t('settings.deleteBtn')}
        </Button>
      </div>
    </div>
  );
}
