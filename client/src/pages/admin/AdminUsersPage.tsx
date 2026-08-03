import { useState } from 'react';
import { toast } from 'sonner';
import AppFilter from '@/common/filter/AppFilter';
import AppPagination from '@/common/pagination/AppPagination';
import { AdminConfirmDialog } from '@/components/admin/shared/AdminConfirmDialog';
import { AdminUserDetailModal } from '@/components/admin/models/user/AdminUserDetailModal';
import { AdminUsersHeader } from '@/components/admin/users/AdminUsersHeader';
import { AdminUsersTable } from '@/components/admin/users/AdminUsersTable';
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
  const [page, setPage] = useState(1);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<UserFilterState>({
    name: '',
    role: 'all',
    status: 'all',
  });

  const queryParams: AdminUsersParams = {
    limit: 8,
    page,
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
        if (users.length === 1 && page > 1) {
          setPage(current => current - 1);
        }
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
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          {/*
            Dùng AppFilter dùng chung (partner/manager đang dùng) thay cho <select> thô + Label
            riêng: cùng chiều cao ô, cùng shadcn Select, cùng nút Reset. Ô lọc "category" ở đây
            mang nghĩa Role — đó là lý do AppFilter nhận placeholder tuỳ biến.
          */}
          <AppFilter
            search={filters.name}
            searchPlaceholder="Search full name"
            onSearchChange={value => {
              setPage(1);
              setFilters(current => ({ ...current, name: value }));
            }}
            category={filters.role}
            categoryPlaceholder="Role"
            categoryOptions={roleOptions}
            onCategoryChange={value => {
              setPage(1);
              setFilters(current => ({
                ...current,
                role: value as UserFilterState['role'],
              }));
            }}
            status={filters.status}
            statusPlaceholder="Status"
            statusOptions={statusOptions}
            onStatusChange={value => {
              setPage(1);
              setFilters(current => ({
                ...current,
                status: value as UserFilterState['status'],
              }));
            }}
            resetDisabled={!filterCount}
            onReset={() => {
              setPage(1);
              setFilters({ name: '', role: 'all', status: 'all' });
            }}
          />
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
          pagination={
            data && data.totalResults > 0 ? (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-slate-500">
                  Showing{' '}
                  <span className="font-semibold text-slate-700">
                    {(data.page - 1) * data.limit + 1}–
                    {Math.min(data.page * data.limit, data.totalResults)}
                  </span>{' '}
                  of{' '}
                  <span className="font-semibold text-slate-700">
                    {data.totalResults}
                  </span>{' '}
                  users
                </p>

                <AppPagination
                  currentPage={data.page}
                  totalPages={Math.max(data.totalPages, 1)}
                  onPageChange={setPage}
                />
              </div>
            ) : undefined
          }
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
          userToDelete?.fullName ??
          userToDelete?.name ??
          userToDelete?.email ??
          ''
        }"? This action cannot be undone.`}
        onClose={() => setUserToDelete(null)}
        onConfirm={handleConfirmDelete}
        open={Boolean(userToDelete)}
        title="Delete user"
      />
    </div>
  );
}
