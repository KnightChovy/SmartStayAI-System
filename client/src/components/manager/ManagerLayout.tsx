import { Outlet } from 'react-router';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import CommonSidebar from '@/common/sidebar/Sidebar';
import CommonNavbar from '@/common/navbar/Navbar';
import { useLogout } from '@/hooks/auth';
import {
  LayoutDashboard,
  ShieldCheck,
  Users,
  TrendingUp,
  BarChart2,
  Settings,
} from 'lucide-react';

const navItems = [
  { name: 'Dashboard', href: '/manager/dashboard', icon: LayoutDashboard },
  { name: 'Verifications', href: '/manager/verification', icon: ShieldCheck },
  { name: 'Hotel Partners', href: '/manager/hotel-partners', icon: Users },
  { name: 'Revenue', href: '/manager/revenue', icon: TrendingUp },
  { name: 'Analytics', href: '/manager/analytics', icon: BarChart2 },
];

const footerItems = [
  { name: 'Settings', href: '/manager/settings', icon: Settings },
];

export function ManagerLayout() {
  const { mutate: logout, isPending: isLoggingOut } = useLogout();
  return (
    <SidebarProvider>
      <CommonSidebar
        title="SmartStay AI"
        subtitle="Manager Portal"
        navItems={navItems}
        footerItems={footerItems}
        onLogout={() => logout()}
        isLoggingOut={isLoggingOut}
      />
      <SidebarInset>
        <CommonNavbar />
        <main className="flex-1 min-w-0 p-4 md:p-6 overflow-y-auto bg-gray-50">
          <div className="mx-auto w-full max-w-7xl">
            <Outlet />
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
