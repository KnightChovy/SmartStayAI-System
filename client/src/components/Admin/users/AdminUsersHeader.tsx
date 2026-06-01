import { Filter, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AdminPageHeader } from '@/components/Admin/shared/AdminPageHeader';

export function AdminUsersHeader() {
  return (
    <AdminPageHeader
      title="User Moderation"
      description="Monitor and manage the Smart Stay community."
      actions={
        <>
          <Button variant="outline" className="h-12 rounded-full px-6">
            <Filter className="mr-2 size-4" />
            Filters
          </Button>
          <Button className="h-12 rounded-full bg-black px-6 text-white">
            <UserPlus className="mr-2 size-4" />
            Add Moderator
          </Button>
        </>
      }
    />
  );
}
