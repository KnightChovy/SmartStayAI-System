import { Outlet, useLocation } from 'react-router';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import CommonSidebar from '@/common/sidebar/Sidebar';
import CommonNavbar from '@/common/navbar/Navbar';
import { useLogout } from '@/hooks/auth';
import { usePartnerVerification } from '@/hooks/hotel-verify';
import { PartnerVerificationGate } from '@/components/hotel-partner/hotel-verify/PartnerVerificationGate';
import {
  LayoutDashboard,
  ShieldCheck,
  Hotel,
  Archive,
  Users,
  CalendarDays,
  Banknote,
  RotateCcw,
  BarChart2,
  MessageSquareShare,
  Settings,
  Sparkles,
  Loader2,
} from 'lucide-react';

const navItems = [
  { name: 'Dashboard', href: '/partner/dashboard', icon: LayoutDashboard },
  { name: 'Verification', href: '/partner/verify', icon: ShieldCheck },
  { name: 'Hotels', href: '/partner/hotel-management', icon: Hotel },
  { name: 'Room Inventory', href: '/partner/room-inventory', icon: Archive },
  { name: 'Amenities', href: '/partner/amenities', icon: Sparkles },
  { name: 'Staff', href: '/partner/staff', icon: Users },
  { name: 'Bookings', href: '/partner/bookings', icon: CalendarDays },
  { name: 'Refunds', href: '/partner/refunds', icon: RotateCcw },
  { name: 'Revenue', href: '/partner/revenue', icon: Banknote },
  { name: 'Analytics', href: '/partner/analytics', icon: BarChart2 },
  { name: 'Reviews', href: '/partner/reviews', icon: MessageSquareShare },
];

const footerItems = [
  { name: 'Settings', href: '/partner/settings', icon: Settings },
];

/** Route được phép truy cập kể cả khi chưa verify (để partner còn hoàn tất hồ sơ + sửa profile). */
function isAllowedWhenUnverified(pathname: string): boolean {
  return (
    pathname.startsWith('/partner/verify') ||
    pathname.startsWith('/partner/profile')
  );
}

export function HotelPartnerLayout() {
  const { mutate: logout, isPending: isLoggingOut } = useLogout();
  const { pathname } = useLocation();
  const { isVerified, isLoading, isError, state } = usePartnerVerification();

  const allowed = isAllowedWhenUnverified(pathname);
  // Fail-open khi lỗi mạng để không khoá nhầm partner; chỉ chặn khi CHẮC CHẮN chưa verified.
  const showGate = !allowed && !isLoading && !isError && !isVerified;
  const resolving = !allowed && isLoading;

  return (
    <SidebarProvider>
      <CommonSidebar
        title="StayHub"
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
            {resolving ? (
              <div className="flex min-h-[60vh] items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-role-partner-primary" />
              </div>
            ) : showGate && state !== 'verified' ? (
              <PartnerVerificationGate state={state} />
            ) : (
              <Outlet />
            )}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
