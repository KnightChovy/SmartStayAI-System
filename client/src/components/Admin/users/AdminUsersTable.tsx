import { AdminTable } from '@/components/Admin/shared/AdminTable';

interface AdminUsersTableProps {
  rows: string[][];
}

export function AdminUsersTable({ rows }: AdminUsersTableProps) {
  return (
    <AdminTable
      headers={['User', 'Role', 'Join Date', 'Verification', 'Status']}
      rows={rows}
    />
  );
}
