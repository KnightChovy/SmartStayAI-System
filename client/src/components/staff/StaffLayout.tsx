import { Outlet, useNavigate } from 'react-router';
import {
  LayoutDashboard,
  ConciergeBell,
  BedDouble,
  Sparkles,
  Building2,
  RefreshCw,
  Bell,
  HelpCircle,
} from 'lucide-react';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import CommonSidebar from '@/common/sidebar/Sidebar';
import CommonNavbar from '@/common/navbar/Navbar';
import { useAuthStore } from '@/stores/authStore';
import { useStaffHotelStore } from '@/stores/staffHotelStore';
import { useStaffHotels } from '@/hooks/staff';
import { useLogout } from '@/hooks/auth';
import { ROUTES } from '@/constants/routes';

const navItems = [
  { name: 'Overview', href: ROUTES.staffDashboard, icon: LayoutDashboard },
  { name: 'Front desk', href: ROUTES.staffFrontDesk, icon: ConciergeBell },
  { name: 'Housekeeping', href: ROUTES.staffHousekeeping, icon: Sparkles },
  { name: 'Room map', href: ROUTES.staffRooms, icon: BedDouble },
];

export function StaffLayout() {
  const navigate = useNavigate();
  const user = useAuthStore(state => state.user);
  const hotel = useStaffHotelStore(state => state.hotel);
  const clearHotel = useStaffHotelStore(state => state.clearHotel);
  const { mutate: logout, isPending: isLoggingOut } = useLogout();

  // Only let staff switch hotels when they're actually assigned to more than one. With a single
  // assignment there's nothing to switch to, so the "Change" button is hidden.
  const { data: assignedHotels } = useStaffHotels();
  const canSwitchHotel = (assignedHotels?.length ?? 0) > 1;

  const userName = user?.name ?? 'Staff';

  return (
    <SidebarProvider>
      <CommonSidebar
        logoChar="S"
        title="SmartStay AI"
        subtitle="Staff Portal"
        navItems={navItems}
        onLogout={() => logout()}
        isLoggingOut={isLoggingOut}
      />
      <SidebarInset>
        <CommonNavbar
          searchPlaceholder="Search bookings, rooms, guests..."
          userName={userName}
          rightContent={
            <>
              <div className="hidden items-center gap-2 text-sm sm:flex">
                <Building2 className="size-4 text-slate-400" />
                {hotel ? (
                  <span className="font-medium text-slate-900">
                    {hotel.name}
                    <span className="ml-1.5 text-slate-400">· {hotel.city}</span>
                  </span>
                ) : (
                  <span className="text-slate-400">No hotel selected</span>
                )}
                {canSwitchHotel && (
                  <Button
                    variant="ghost"
                    size="xs"
                    className="ml-1 text-slate-500"
                    onClick={() => {
                      clearHotel();
                      navigate(ROUTES.staffSelectHotel);
                    }}
                  >
                    <RefreshCw className="size-3" />
                    Change
                  </Button>
                )}
              </div>
              <div className="hidden h-6 w-px bg-outline-variant/40 sm:block" />
              <button
                className="inline-flex size-8 items-center justify-center rounded-full border border-outline-variant/40"
                type="button"
              >
                <Bell className="size-3.5" />
              </button>
              <button
                className="inline-flex size-8 items-center justify-center rounded-full border border-outline-variant/40"
                type="button"
              >
                <HelpCircle className="size-3.5" />
              </button>
              <div className="h-6 w-px bg-outline-variant/40" />
              <div className="flex items-center gap-2">
                <Avatar className="size-8 rounded-full bg-surface-container">
                  <AvatarFallback>{userName.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <p className="hidden text-sm font-semibold sm:block">{userName}</p>
              </div>
            </>
          }
        />
        <main className="flex-1 min-w-0 p-4 md:p-6 overflow-y-auto bg-gray-50">
          <div className="mx-auto w-full max-w-7xl">
            <Outlet />
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
