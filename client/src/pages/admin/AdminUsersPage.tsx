import { AdminUsersHeader } from '@/components/admin/users/AdminUsersHeader';
import { AdminUsersTable } from '@/components/admin/users/AdminUsersTable';

const users = [
  ['Julian Vance', 'Host', 'Oct 12, 2023', 'ID Verified', 'Active'],
  ['Sarah Jenkins', 'Guest', 'Jan 05, 2024', 'Pending ID', 'Restricted'],
  ['Mark Lindell', 'Host', 'Nov 22, 2022', 'Revoked', 'Suspended'],
];

export function AdminUsersPage() {
  return (
    <div className="space-y-6">
      <AdminUsersHeader />
      <AdminUsersTable rows={users} />
    </div>
  );
}
