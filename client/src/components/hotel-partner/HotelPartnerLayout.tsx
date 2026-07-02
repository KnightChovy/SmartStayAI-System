import { Outlet } from 'react-router';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import CommonSidebar from '@/common/sidebar/Sidebar';
import CommonNavbar from '@/common/navbar/Navbar';
import { useLogout } from '@/hooks/auth';
import {
  LayoutDashboard,
  ShieldCheck,
  Hotel,
  Archive,
  Users,
  CalendarDays,
  Banknote,
  BarChart2,
  MessageSquareShare,
  Settings,
  Sparkles,
} from 'lucide-react';

const navItems = [
  { name: 'Dashboard', href: '/partner/dashboard', icon: LayoutDashboard },
  { name: 'Verification', href: '/partner/verify', icon: ShieldCheck },
  { name: 'Hotels', href: '/partner/hotel-management', icon: Hotel },
  { name: 'Room Inventory', href: '/partner/room-inventory', icon: Archive },
  { name: 'Amenities', href: '/partner/amenities', icon: Sparkles },
  { name: 'Staff', href: '/partner/staff', icon: Users },
  { name: 'Bookings', href: '/partner/bookings', icon: CalendarDays },
  { name: 'Revenue', href: '/partner/revenue', icon: Banknote },
  { name: 'Analytics', href: '/partner/analytics', icon: BarChart2 },
  { name: 'Reviews', href: '/partner/reviews', icon: MessageSquareShare },
];

const footerItems = [
  { name: 'Settings', href: '/partner/settings', icon: Settings },
];

export function HotelPartnerLayout() {
  const { mutate: logout, isPending: isLoggingOut } = useLogout();
  return (
    <SidebarProvider>
      <CommonSidebar
        title="SmartStay AI"
        subtitle="Partner Portal"
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
