import { Link, useLocation } from 'react-router';
import { ChevronDown, LayoutDashboard, LogOut, User as UserIcon } from 'lucide-react';
import { useLogout} from '../../hooks/auth';
import { useAuthStore } from '../../stores/authStore';
import { getLandingPathForRole, UserRole } from '@/constants/roles';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import NotificationBell from './NotificationBell';

/** Nhãn hiển thị thân thiện cho từng role. */
const ROLE_LABELS: Record<string, string> = {
  [UserRole.GUEST]: 'Guest',
  [UserRole.CUSTOMER]: 'Customer',
  [UserRole.STAFF]: 'Staff',
  [UserRole.MARKETER]: 'Marketer',
  [UserRole.HOTEL_PARTNER]: 'Hotel Partner',
  [UserRole.PLATFORM_MANAGER]: 'Platform Manager',
  [UserRole.ADMIN]: 'Admin',
};

export default function Navbar() {
  const location = useLocation();
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const user = useAuthStore(state => state.user);
  const { mutateAsync: logout, isPending: isLoggingOut } = useLogout();

  const initials = (user?.name || user?.email || 'US')
    .slice(0, 2)
    .toUpperCase();
  const dashboardPath = user ? getLandingPathForRole(user.role) : '/';
  const hasDashboard = dashboardPath !== '/';

  return (
    <nav className="bg-surface/80 backdrop-blur-xl sticky top-0 z-50 w-full border-b border-outline-variant/30">
      <div className="max-w-7xl mx-auto px-margin-mobile md:px-8 py-4 flex justify-between items-center">
        <Link
          to="/"
          className="font-be-vietnam font-bold tracking-tight text-on-surface text-2xl"
        >
          Smart Stay AI
        </Link>
        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-6 text-sm font-semibold text-on-surface-variant">
            <Link
              to="/"
              className={`hover:text-primary transition-colors ${location.pathname === '/' ? 'text-secondary font-bold' : ''}`}
            >
              Home
            </Link>
            <Link
              to="/deals"
              className={`hover:text-primary transition-colors ${location.pathname === '/deals' ? 'text-secondary font-bold' : ''}`}
            >
              Deals
            </Link>
            <Link
              to="/destinations"
              className={`hover:text-primary transition-colors ${location.pathname === '/destinations' ? 'text-secondary font-bold' : ''}`}
            >
              Destinations
            </Link>
            <Link
              to="/accommodation-types"
              className={`hover:text-primary transition-colors ${location.pathname === '/accommodation-types' ? 'text-secondary font-bold' : ''}`}
            >
              Stays
            </Link>
            <button className="hover:text-primary transition-colors flex items-center gap-1">
              USD{' '}
              <span className="material-symbols-outlined text-sm">
                expand_more
              </span>
            </button>
            <button className="hover:text-primary transition-colors flex items-center gap-1">
              EN{' '}
              <span className="material-symbols-outlined text-sm">
                language
              </span>
            </button>
          </div>
          <div className="flex items-center gap-3">
            {isAuthenticated && user ? (
              <>
              <NotificationBell />
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-2 rounded-full p-1 pr-2 hover:bg-surface-container-low transition-colors outline-none cursor-pointer data-[state=open]:bg-surface-container-low">
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user?.name || 'User'}
                      className="size-8 rounded-full object-cover border border-outline-variant"
                    />
                  ) : (
                    <div className="size-8 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-bold text-xs">
                      {initials}
                    </div>
                  )}
                  <ChevronDown className="size-4 text-on-surface-variant" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  {/* User info header */}
                  <div className="flex items-center gap-3 px-2 py-2.5">
                    {user.avatarUrl ? (
                      <img
                        src={user.avatarUrl}
                        alt={user?.name || 'User'}
                        className="size-10 rounded-full object-cover border border-outline-variant"
                      />
                    ) : (
                      <div className="size-10 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-bold text-sm">
                        {initials}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-on-surface truncate">
                        {user?.name || 'User'}
                      </p>
                      <p className="text-xs text-on-surface-variant truncate">
                        {user?.email}
                      </p>
                    </div>
                  </div>
                  <div className="px-2 pb-1.5">
                    <span className="inline-block rounded-full bg-secondary-container/60 text-on-secondary-container text-[11px] font-semibold px-2 py-0.5">
                      {ROLE_LABELS[user.role] ?? user.role}
                    </span>
                  </div>
                  <DropdownMenuSeparator />
                  {hasDashboard && (
                    <DropdownMenuItem asChild>
                      <Link to={dashboardPath} className="cursor-pointer">
                        <LayoutDashboard className="size-4" />
                        Dashboard
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem asChild>
                    <Link to="/account/profile" className="cursor-pointer">
                      <UserIcon className="size-4" />
                      My Account
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    disabled={isLoggingOut}
                    onSelect={() => logout()}
                    className="cursor-pointer"
                  >
                    <LogOut className="size-4" />
                    {isLoggingOut ? 'Logging out...' : 'Log out'}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-5 py-2 text-sm font-semibold text-on-surface hover:bg-surface-container-low rounded-xl transition-all text-center"
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  className="px-5 py-2 text-sm font-semibold bg-on-surface text-white rounded-xl hover:bg-primary transition-all text-center"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
