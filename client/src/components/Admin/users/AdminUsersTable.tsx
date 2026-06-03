import { MoreHorizontal } from 'lucide-react';
import { AdminTable } from '@/components/Admin/shared/AdminTable';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { AdminUsersTableProps } from '@/types/admin.types';

export function AdminUsersTable({ rows }: AdminUsersTableProps) {
  const rowsWithActions = rows.map(row => [...row, '']);

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
      rows={rowsWithActions}
      renderLastColumn={() => (
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
            <DropdownMenuItem>View details</DropdownMenuItem>
            <DropdownMenuItem>Edit user</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive">Delete user</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    />
  );
}
