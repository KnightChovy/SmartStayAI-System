import { Filter, UserPlus, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AdminPageHeader } from '@/components/admin/shared/AdminPageHeader';

interface AdminUsersHeaderProps {
  filterCount: number;
  isFiltersOpen: boolean;
  onAddUser: () => void;
  onToggleFilters: () => void;
}

export function AdminUsersHeader({
  filterCount,
  isFiltersOpen,
  onAddUser,
  onToggleFilters,
}: AdminUsersHeaderProps) {
  return (
    <AdminPageHeader
      icon={Users}
      title="User Moderation"
      description="Monitor and manage the StayHub community."
      actions={
        <>
          <Button
            aria-expanded={isFiltersOpen}
            className="rounded-lg px-4"
            onClick={onToggleFilters}
            type="button"
            variant="outline"
          >
            <Filter className="mr-2 size-4" />
            {filterCount ? `Filters (${filterCount})` : 'Filters'}
          </Button>
          <Button
            className="rounded-lg bg-role-admin-primary px-4 text-white hover:bg-role-admin-secondary"
            onClick={onAddUser}
            type="button"
          >
            <UserPlus className="mr-2 size-4" />
            Add User
          </Button>
        </>
      }
    />
  );
}
