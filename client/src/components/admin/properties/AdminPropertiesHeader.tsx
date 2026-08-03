import { Building2 } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/shared/AdminPageHeader';

export function AdminPropertiesHeader() {
  return (
    <AdminPageHeader
      icon={Building2}
      title="Property Management"
      description="Manage, monitor and audit 1,248 active listings globally."
    />
  );
}
