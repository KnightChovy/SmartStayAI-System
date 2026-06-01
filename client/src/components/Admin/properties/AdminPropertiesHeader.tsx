import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AdminPageHeader } from '@/components/Admin/shared/AdminPageHeader';

export function AdminPropertiesHeader() {
  return (
    <AdminPageHeader
      title="Property Management"
      description="Manage, monitor and audit 1,248 active listings globally."
      actions={
        <Button className="h-12 rounded-full bg-blue-500 px-6 text-white">
          <Plus className="mr-2 size-4" />
          Add Property
        </Button>
      }
    />
  );
}
