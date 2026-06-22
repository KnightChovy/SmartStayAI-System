import { AdminUsersHeader } from '@/components/admin/users/AdminUsersHeader';
import { AdminUsersTable } from '@/components/admin/users/AdminUsersTable';
import { useAdminUsers } from '@/hooks/admin';
import { errorMessage } from '@/utils/errorMessage';
import { formatDateShort } from '@/utils/formatDate';

function formatRole(role: string): string {
  return role
    .split('_')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function AdminUsersPage() {
  const { data, isLoading, isError, error } = useAdminUsers({
    limit: 20,
    sortBy: 'createdAt:desc',
  });

  const rows =
    data?.results.map(user => [
      user.fullName ?? user.name ?? user.email,
      formatRole(user.role),
      formatDateShort(user.createdAt),
      user.emailVerifiedAt ? 'Email verified' : 'Email pending',
      user.status,
    ]) ?? [];

  return (
    <div className="space-y-6">
      <AdminUsersHeader />
      {isLoading && (
        <p className="text-sm text-muted-foreground">Loading users...</p>
      )}
      {isError && (
        <p className="text-sm font-medium text-destructive">
          {errorMessage(error, 'Could not load users.')}
        </p>
      )}
      {!isLoading && !isError && <AdminUsersTable rows={rows} />}
    </div>
  );
}
