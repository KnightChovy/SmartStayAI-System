import { useEffect, useState } from 'react';
import { CheckCircle2, ShieldCheck, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { AdminConfirmDialog } from '@/components/admin/shared/AdminConfirmDialog';
import { UserRole } from '@/constants/roles';
import {
  useAdminUser,
  useDeleteAdminUser,
  useUpdateAdminUserRole,
  useUpdateAdminUserStatus,
} from '@/hooks/admin';
import type { AdminUserStatus } from '@/types/admin.types';
import { errorMessage } from '@/utils/errorMessage';
import { formatDateShort } from '@/utils/formatDate';

interface AdminUserDetailModalProps {
  userId: string;
  onClose: () => void;
  onDeleted: () => void;
}

const roleOptions = [
  { label: 'Admin', value: UserRole.ADMIN },
  { label: 'Platform manager', value: UserRole.PLATFORM_MANAGER },
  { label: 'Hotel partner', value: UserRole.HOTEL_PARTNER },
  { label: 'Staff', value: UserRole.STAFF },
  { label: 'Marketer', value: UserRole.MARKETER },
  { label: 'Customer', value: UserRole.CUSTOMER },
  { label: 'Guest', value: UserRole.GUEST },
];

const statusOptions: AdminUserStatus[] = ['active', 'inactive', 'suspended'];

function formatRole(role: string): string {
  return role
    .split('_')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function AdminUserDetailModal({
  userId,
  onClose,
  onDeleted,
}: AdminUserDetailModalProps) {
  const { data: user, isLoading, isError, error } = useAdminUser(userId);
  const updateStatus = useUpdateAdminUserStatus();
  const updateRole = useUpdateAdminUserRole();
  const deleteUser = useDeleteAdminUser();

  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !confirmDelete) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, confirmDelete]);

  const handleRoleChange = (role: UserRole) => {
    if (!user || role === user.role) return;
    updateRole.mutate(
      { userId: user.id, payload: { role } },
      {
        onSuccess: () => toast.success('Role updated'),
        onError: err => toast.error(errorMessage(err, 'Could not update role.')),
      }
    );
  };

  const handleStatusChange = (status: AdminUserStatus) => {
    if (!user || status === user.status) return;
    updateStatus.mutate(
      { userId: user.id, payload: { status } },
      {
        onSuccess: () => toast.success('Status updated'),
        onError: err => toast.error(errorMessage(err, 'Could not update status.')),
      }
    );
  };

  const handleDelete = () => {
    if (!user) return;
    deleteUser.mutate(user.id, {
      onSuccess: () => {
        toast.success('User deleted');
        onDeleted();
      },
      onError: err => {
        toast.error(errorMessage(err, 'Could not delete user.'));
        setConfirmDelete(false);
      },
    });
  };

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/45 p-3 backdrop-blur-sm sm:p-6"
      role="dialog"
    >
      <button
        aria-label="Close user detail"
        className="absolute inset-0 h-full w-full"
        onClick={onClose}
        type="button"
      />

      <section className="relative z-10 w-full max-w-2xl overflow-hidden rounded-[28px] bg-white shadow-2xl">
        <header className="flex items-start justify-between gap-4 border-b border-outline-variant/40 px-4 py-4 sm:px-6">
          <div>
            <h2 className="text-xl font-bold text-slate-950">
              {isLoading
                ? 'Loading user...'
                : (user?.fullName ?? user?.name ?? user?.email ?? 'User detail')}
            </h2>
            {user && (
              <p className="mt-1 text-xs font-semibold text-muted-foreground">
                {user.email}
              </p>
            )}
          </div>
          <button
            aria-label="Close user detail"
            className="inline-flex size-8 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100"
            onClick={onClose}
            type="button"
          >
            <X className="size-4" />
          </button>
        </header>

        <div className="max-h-[75vh] overflow-y-auto p-4 sm:p-6">
          {isLoading && (
            <p className="text-sm text-muted-foreground">Loading user...</p>
          )}
          {isError && (
            <p className="text-sm font-medium text-destructive">
              {errorMessage(error, 'Could not load this user.')}
            </p>
          )}

          {user && (
            <div className="space-y-4">
              <div className="rounded-2xl border bg-white p-4 shadow-sm">
                <h3 className="mb-3 text-sm font-semibold text-slate-900">
                  User information
                </h3>
                <div className="space-y-1">
                  <Row label="Full name" value={user.fullName ?? user.name ?? '—'} />
                  <Row label="Email" value={user.email} />
                  <Row label="Phone" value={user.phone ?? '—'} />
                  <Row
                    label="Email verification"
                    value={user.emailVerifiedAt ? 'Verified' : 'Pending'}
                  />
                  <Row label="Joined" value={formatDateShort(user.createdAt)} />
                  {user.lastLoginAt && (
                    <Row label="Last login" value={formatDateShort(user.lastLoginAt)} />
                  )}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border bg-white p-4 shadow-sm">
                  <h3 className="mb-3 text-sm font-semibold text-slate-900">Role</h3>
                  <select
                    className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/50"
                    disabled={updateRole.isPending}
                    onChange={event => handleRoleChange(event.target.value as UserRole)}
                    value={user.role}
                  >
                    {roleOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <ShieldCheck className="size-3.5" /> Current: {formatRole(user.role)}
                  </p>
                </div>

                <div className="rounded-2xl border bg-white p-4 shadow-sm">
                  <h3 className="mb-3 text-sm font-semibold text-slate-900">Status</h3>
                  <select
                    className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/50"
                    disabled={updateStatus.isPending}
                    onChange={event =>
                      handleStatusChange(event.target.value as AdminUserStatus)
                    }
                    value={user.status}
                  >
                    {statusOptions.map(status => (
                      <option key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </option>
                    ))}
                  </select>
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <CheckCircle2 className="size-3.5" /> Current: {user.status}
                  </p>
                </div>
              </div>

              <button
                className="inline-flex h-9 items-center gap-1.5 rounded-full border border-red-200 px-4 text-sm font-semibold text-red-600 hover:bg-red-50"
                onClick={() => setConfirmDelete(true)}
                type="button"
              >
                <Trash2 className="size-4" /> Delete user
              </button>
            </div>
          )}
        </div>
      </section>

      {user && (
        <AdminConfirmDialog
          confirmLabel="Delete user"
          destructive
          loading={deleteUser.isPending}
          message={`Are you sure you want to delete "${
            user.fullName ?? user.name ?? user.email
          }"? This action cannot be undone.`}
          onClose={() => setConfirmDelete(false)}
          onConfirm={handleDelete}
          open={confirmDelete}
          title="Delete user"
        />
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 py-1.5 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="text-right font-medium text-slate-900">{value}</span>
    </div>
  );
}
