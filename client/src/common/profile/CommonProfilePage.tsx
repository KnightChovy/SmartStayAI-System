import { useTranslation } from 'react-i18next';
import { useProfile } from '@/hooks/account';
import { Skeleton } from '@/components/ui/skeleton';
import { ProfileForm } from './ProfileForm';

export function CommonProfilePage() {
  const { t } = useTranslation('account');
  const { data: profile } = useProfile();

  return (
    <div>
      <h2 className="font-be-vietnam text-2xl font-bold text-on-surface">
        {t('profile.title')}
      </h2>
      <p className="mt-1 text-sm text-on-surface-variant">
        {t('profile.subtitle')}
      </p>

      {profile ? (
        <ProfileForm initial={profile} />
      ) : (
        <Skeleton className="mt-6 h-96 w-full rounded-2xl" />
      )}
    </div>
  );
}
