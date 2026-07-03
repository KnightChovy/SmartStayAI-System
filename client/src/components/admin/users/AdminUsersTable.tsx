import { MoreHorizontal } from 'lucide-react';
import { AdminTable } from '@/components/admin/shared/AdminTable';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { AdminUser, AdminUsersTableProps } from '@/types/admin.types';
import { formatDateShort } from '@/utils/formatDate';

function formatRole(role: string): string {
  return role
    .split('_')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function AdminUsersTable({
  users,
  onView,
  onEdit,
  onDelete,
  isDeleting,
}: AdminUsersTableProps) {
  const rows = users.map(user => [
    user.fullName ?? user.name ?? user.email,
    formatRole(user.role),
    formatDateShort(user.createdAt),
    user.emailVerifiedAt ? 'Email verified' : 'Email pending',
    user.status,
    user.id,
  ]);

  const findUser = (id: string): AdminUser | undefined =>
    users.find(user => user.id === id);

  return (
    <AdminTable
      headers={[
        'User',
        'Role',
        'Join Date',
        'Verification',
        'Status',
        'Actions',
      ]}
      rows={rows}
      renderLastColumn={row => {
        const user = findUser(row[5]);
        if (!user) return null;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                aria-label="Open user actions"
                className="rounded-full"
                size="icon-sm"
                type="button"
                variant="outline"
              >
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuLabel>User actions</DropdownMenuLabel>
              <DropdownMenuItem onSelect={() => onView(user)}>
                View details
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => onEdit(user)}>
                Edit user
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                disabled={isDeleting}
                onSelect={() => onDelete(user)}
                variant="destructive"
              >
                Delete user
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      }}
    />
  );
}
