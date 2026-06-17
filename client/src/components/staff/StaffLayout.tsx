import { NavLink, Outlet, useNavigate } from 'react-router';
import {
  LayoutDashboard,
  ConciergeBell,
  BedDouble,
  Sparkles,
  Building2,
  LogOut,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/authStore';
import { useStaffHotelStore } from '@/stores/staffHotelStore';
import { authService } from '@/services/auth.service';
import { ROUTES } from '@/constants/routes';

const navItems = [
  { to: ROUTES.staffDashboard, label: 'Tổng quan', icon: LayoutDashboard, end: true },
  { to: ROUTES.staffFrontDesk, label: 'Quầy lễ tân', icon: ConciergeBell, end: false },
  { to: ROUTES.staffHousekeeping, label: 'Dọn phòng', icon: Sparkles, end: false },
  { to: ROUTES.staffRooms, label: 'Bản đồ phòng', icon: BedDouble, end: false },
];

export function StaffLayout() {
  const navigate = useNavigate();
  const user = useAuthStore(state => state.user);
  const clearAuth = useAuthStore(state => state.clearAuth);
  const refreshToken = useAuthStore(state => state.refreshToken);
  const hotel = useStaffHotelStore(state => state.hotel);
  const clearHotel = useStaffHotelStore(state => state.clearHotel);

  const handleLogout = async () => {
    try {
      if (refreshToken) await authService.logout(refreshToken);
    } catch {
      // Bỏ qua lỗi mạng khi logout — vẫn xoá phiên cục bộ.
    }
    clearAuth();
    navigate(ROUTES.login, { replace: true });
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-slate-200 bg-white md:flex">
        <div className="flex items-center gap-2 px-5 py-4">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <ConciergeBell className="size-5" />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold text-slate-900">SmartStay AI</p>
            <p className="text-xs text-slate-500">Cổng nhân viên</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-2">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                )
              }
            >
              <item.icon className="size-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-slate-200 p-3">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-rose-600 transition-colors hover:bg-rose-50"
          >
            <LogOut className="size-4" />
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3 md:px-6">
          <div className="flex items-center gap-2 text-sm">
            <Building2 className="size-4 text-slate-400" />
            {hotel ? (
              <span className="font-medium text-slate-900">
                {hotel.name}
                <span className="ml-1.5 text-slate-400">· {hotel.city}</span>
              </span>
            ) : (
              <span className="text-slate-400">Chưa chọn khách sạn</span>
            )}
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
              Đổi
            </Button>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right leading-tight">
              <p className="text-sm font-medium text-slate-900">{user?.name ?? 'Nhân viên'}</p>
              <p className="text-xs text-slate-500">{user?.email}</p>
            </div>
            <div className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
              {(user?.name ?? 'NV').slice(0, 2).toUpperCase()}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="mx-auto w-full max-w-6xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
