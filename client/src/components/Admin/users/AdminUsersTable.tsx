import { AdminTable } from '@/components/Admin/shared/AdminTable';
import type { AdminUsersTableProps } from '@/types/admin.types';

export function AdminUsersTable({ rows }: AdminUsersTableProps) {
  return (
    <AdminTable
      headers={['User', 'Role', 'Join Date', 'Verification', 'Status']}
      rows={rows}
    />
  );
}
