import { Button } from '@/components/ui/button';
import { useAdminModal } from '@/components/admin/models/AdminModalContext';
import { ROLE_THEME } from '@/constants/roleTheme';
import { cn } from '@/lib/cn';

export function AdminDashboardQuickActions() {
  const { openCreateUser, openMaintenance, openReport } = useAdminModal();

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <h3 className="mb-3 text-sm font-semibold text-slate-900">
        Quick Actions
      </h3>
      <div className="space-y-2">
        {/*
          Một hành động chính (nền màu vai trò) + hai hành động phụ (outline).
          Nút "Generate Report" trước đây dùng variant="secondary" — variant đó lấy màu thương hiệu
          nâu/taupe của cổng guest nên nổi lên giữa bảng màu slate của admin như một lỗi màu.
        */}
        <Button
          className={cn(
            'h-9 w-full rounded-lg text-sm',
            ROLE_THEME.admin.accentBg
          )}
          onClick={openCreateUser}
          type="button"
        >
          Create New User
        </Button>
        <Button
          variant="outline"
          className="h-9 w-full rounded-lg text-sm"
          onClick={openReport}
          type="button"
        >
          Generate Report
        </Button>
        <Button
          variant="outline"
          className="h-9 w-full rounded-lg text-sm"
          onClick={openMaintenance}
          type="button"
        >
          Schedule Maintenance
        </Button>
      </div>
    </div>
  );
}
