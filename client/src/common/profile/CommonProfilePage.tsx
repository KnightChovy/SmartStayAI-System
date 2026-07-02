import { useProfile } from '@/hooks/account';
import { Skeleton } from '@/components/ui/skeleton';
import { ProfileForm } from './ProfileForm';

export function CommonProfilePage() {
  const { data: profile } = useProfile();

  return (
    <div>
      <h2 className="font-be-vietnam text-2xl font-bold text-on-surface">
        Profile
      </h2>
      <p className="mt-1 text-sm text-on-surface-variant">
        Manage your personal information.
      </p>

      {profile ? (
        <ProfileForm initial={profile} />
      ) : (
        <Skeleton className="mt-6 h-96 w-full rounded-2xl" />
      )}
    </div>
  );
}
