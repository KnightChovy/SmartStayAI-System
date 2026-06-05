import { Button } from '@/components/ui/button';
import { useAdminModal } from '@/components/admin/models/AdminModalContext';

export function AdminDashboardQuickActions() {
  const { openCreateUser, openMaintenance, openReport } = useAdminModal();

  return (
    <div className="space-y-2">
      <h3 className="text-xl font-semibold">Quick Actions</h3>
      <Button
        className="h-9 w-full rounded-none bg-black text-sm text-white"
        onClick={openCreateUser}
      >
        Create New User
      </Button>
      <Button
        variant="secondary"
        className="h-9 w-full rounded-none text-sm"
        onClick={openReport}
      >
        Generate Report
      </Button>
      <Button
        variant="outline"
        className="h-9 w-full rounded-none text-sm"
        onClick={openMaintenance}
      >
        Schedule Maintenance
      </Button>
    </div>
  );
}
