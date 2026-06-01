import { Outlet } from 'react-router';
import { AdminNavbar } from './AdminNavbar';
import { AdminSidebar } from './AdminSidebar';

export function AdminLayout() {
  return (
    <div className="min-h-screen bg-[#f7f4f3] text-on-surface">
      <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:block lg:w-[256px]">
        <AdminSidebar />
      </div>

      <div className="lg:pl-[256px]">
        <div className="z-30 lg:fixed lg:top-0 lg:right-0 lg:left-[256px]">
          <AdminNavbar searchPlaceholder="Search data, reports, users..." />
        </div>

        <main className="px-4 py-4 sm:px-5 sm:py-5 lg:px-6 lg:pt-22 lg:pb-6">
          <div className="mx-auto w-full max-w-[1120px]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
