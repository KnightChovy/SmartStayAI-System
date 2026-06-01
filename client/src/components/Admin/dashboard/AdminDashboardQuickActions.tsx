import { Button } from '@/components/ui/button';

export function AdminDashboardQuickActions() {
  return (
    <div className="space-y-2">
      <h3 className="text-xl font-semibold">Quick Actions</h3>
      <Button className="h-9 w-full rounded-none bg-black text-sm text-white">
        Create New User
      </Button>
      <Button variant="secondary" className="h-9 w-full rounded-none text-sm">
        Generate Report
      </Button>
      <Button variant="outline" className="h-9 w-full rounded-none text-sm">
        Schedule Maintenance
      </Button>
    </div>
  );
}
