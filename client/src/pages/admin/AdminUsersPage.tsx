import { useState } from 'react';
import { toast } from 'sonner';
import { AdminConfirmDialog } from '@/components/admin/shared/AdminConfirmDialog';
import { AdminUserDetailModal } from '@/components/admin/models/user/AdminUserDetailModal';
import { AdminUsersHeader } from '@/components/admin/users/AdminUsersHeader';
import { AdminUsersTable } from '@/components/admin/users/AdminUsersTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAdminModal } from '@/components/admin/models/AdminModalContext';
import { UserRole } from '@/constants/roles';
import { useAdminUsers, useDeleteAdminUser } from '@/hooks/admin';
import type { AdminUser, AdminUsersParams } from '@/types/admin.types';
import { errorMessage } from '@/utils/errorMessage';

type UserFilterState = {
  name: string;
  role: UserRole | 'all';
  status: 'active' | 'inactive' | 'suspended' | 'all';
};

const roleOptions = [
  { label: 'All roles', value: 'all' },
  { label: 'Admin', value: UserRole.ADMIN },
  { label: 'Platform manager', value: UserRole.PLATFORM_MANAGER },
  { label: 'Hotel partner', value: UserRole.HOTEL_PARTNER },
  { label: 'Staff', value: UserRole.STAFF },
  { label: 'Marketer', value: UserRole.MARKETER },
  { label: 'Customer', value: UserRole.CUSTOMER },
  { label: 'Guest', value: UserRole.GUEST },
] satisfies Array<{ label: string; value: UserFilterState['role'] }>;

const statusOptions = [
  { label: 'All statuses', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
  { label: 'Suspended', value: 'suspended' },
] satisfies Array<{ label: string; value: UserFilterState['status'] }>;

export function AdminUsersPage() {
  const { openCreateUser } = useAdminModal();
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<UserFilterState>({
    name: '',
    role: 'all',
    status: 'all',
  });

  const queryParams: AdminUsersParams = {
    limit: 20,
    sortBy: 'createdAt:desc',
    name: filters.name.trim() || undefined,
    role: filters.role === 'all' ? undefined : filters.role,
    status: filters.status === 'all' ? undefined : filters.status,
  };

  const filterCount = [
    filters.name.trim(),
    filters.role !== 'all',
    filters.status !== 'all',
  ].filter(Boolean).length;

  const { data, isLoading, isError, error } = useAdminUsers(queryParams);
  const deleteUser = useDeleteAdminUser();
  const [userToDelete, setUserToDelete] = useState<AdminUser | null>(null);
  const [detailUserId, setDetailUserId] = useState<string | null>(null);

  const users = data?.results ?? [];

  const handleConfirmDelete = () => {
    if (!userToDelete) return;

    deleteUser.mutate(userToDelete.id, {
      onSuccess: () => {
        toast.success('User deleted');
        setUserToDelete(null);
      },
      onError: err => {
        toast.error(errorMessage(err, 'Could not delete user.'));
      },
    });
  };

  return (
    <div className="space-y-6">
      <AdminUsersHeader
        filterCount={filterCount}
        isFiltersOpen={isFiltersOpen}
        onAddUser={openCreateUser}
        onToggleFilters={() => setIsFiltersOpen(open => !open)}
      />
      {isFiltersOpen ? (
        <div className="grid gap-3 rounded-2xl border bg-white p-4 shadow-sm md:grid-cols-[minmax(0,1.4fr)_minmax(180px,0.8fr)_minmax(180px,0.8fr)_auto] md:items-end">
          <div className="space-y-2">
            <Label htmlFor="admin-user-filter-name">Name</Label>
            <Input
              id="admin-user-filter-name"
              onChange={event =>
                setFilters(current => ({
                  ...current,
                  name: event.target.value,
                }))
              }
              placeholder="Search full name"
              value={filters.name}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="admin-user-filter-role">Role</Label>
            <select
              className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/50"
              id="admin-user-filter-role"
              onChange={event =>
                setFilters(current => ({
                  ...current,
                  role: event.target.value as UserFilterState['role'],
                }))
              }
              value={filters.role}
            >
              {roleOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="admin-user-filter-status">Status</Label>
            <select
              className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/50"
              id="admin-user-filter-status"
              onChange={event =>
                setFilters(current => ({
                  ...current,
                  status: event.target.value as UserFilterState['status'],
                }))
              }
              value={filters.status}
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <Button
            className="h-9 rounded-full px-4"
            disabled={!filterCount}
            onClick={() =>
              setFilters({ name: '', role: 'all', status: 'all' })
            }
            type="button"
            variant="outline"
          >
            Reset
          </Button>
        </div>
      ) : null}
      {isLoading && (
        <p className="text-sm text-muted-foreground">Loading users...</p>
      )}
      {isError && (
        <p className="text-sm font-medium text-destructive">
          {errorMessage(error, 'Could not load users.')}
        </p>
      )}
      {!isLoading && !isError && (
        <AdminUsersTable
          isDeleting={deleteUser.isPending}
          onDelete={setUserToDelete}
          onEdit={user => setDetailUserId(user.id)}
          onView={user => setDetailUserId(user.id)}
          users={users}
        />
      )}

      {detailUserId && (
        <AdminUserDetailModal
          onClose={() => setDetailUserId(null)}
          onDeleted={() => setDetailUserId(null)}
          userId={detailUserId}
        />
      )}

      <AdminConfirmDialog
        confirmLabel="Delete user"
        destructive
        loading={deleteUser.isPending}
        message={`Are you sure you want to delete "${
          userToDelete?.fullName ?? userToDelete?.name ?? userToDelete?.email ?? ''
        }"? This action cannot be undone.`}
        onClose={() => setUserToDelete(null)}
        onConfirm={handleConfirmDelete}
        open={Boolean(userToDelete)}
        title="Delete user"
      />
    </div>
  );
}
