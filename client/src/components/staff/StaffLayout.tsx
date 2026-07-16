import { Outlet, useNavigate } from 'react-router';
import {
  LayoutDashboard,
  ConciergeBell,
  BedDouble,
  MessageSquare,
  Sparkles,
  Building2,
  RefreshCw,
} from 'lucide-react';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import CommonSidebar from '@/common/sidebar/Sidebar';
import CommonNavbar from '@/common/navbar/Navbar';
import { useAuthStore } from '@/stores/authStore';
import { useStaffHotelStore } from '@/stores/staffHotelStore';
import { useStaffHotels } from '@/hooks/staff';
import { useLogout } from '@/hooks/auth';
import { StaffGlobalSearch } from './StaffGlobalSearch';
import { StaffNotifications } from './StaffNotifications';
import { StaffHelpMenu } from './StaffHelpMenu';
import { ROUTES } from '@/constants/routes';

const navItems = [
  { name: 'Overview', href: ROUTES.staffDashboard, icon: LayoutDashboard },
  { name: 'Front desk', href: ROUTES.staffFrontDesk, icon: ConciergeBell },
  { name: 'Chat', href: ROUTES.staffChat, icon: MessageSquare },
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

  const userName = user?.fullName ?? 'Staff';

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
          userName={userName}
          searchSlot={<StaffGlobalSearch />}
          bellSlot={<StaffNotifications />}
          helpSlot={<StaffHelpMenu />}
          leadingActions={
            <>
              <div className="hidden items-center gap-2 text-sm sm:flex">
                <Building2 className="size-4 text-slate-400" />
                {hotel ? (
                  <div className="flex max-w-40 flex-col leading-tight">
                    <span className="truncate font-medium text-slate-900">
                      {hotel.name}
                    </span>
                    <span className="truncate text-xs text-slate-400">
                      {hotel.city}
                    </span>
                  </div>
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
