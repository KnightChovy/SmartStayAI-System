import { Filter, UserPlus } from 'lucide-react';
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
      title="User Moderation"
      description="Monitor and manage the Smart Stay community."
      actions={
        <>
          <Button
            aria-expanded={isFiltersOpen}
            className="h-12 rounded-full px-6"
            onClick={onToggleFilters}
            type="button"
            variant="outline"
          >
            <Filter className="mr-2 size-4" />
            {filterCount ? `Filters (${filterCount})` : 'Filters'}
          </Button>
          <Button
            className="h-12 rounded-full bg-black px-6 text-white"
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
