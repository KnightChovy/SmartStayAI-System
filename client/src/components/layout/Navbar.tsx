import { Link, useLocation } from 'react-router';
import { useTranslation } from 'react-i18next';
import {
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Store,
  User as UserIcon,
} from 'lucide-react';
import { useLogout } from '../../hooks/auth';
import { useAuthStore } from '../../stores/authStore';
import { getLandingPathForRole, UserRole } from '@/constants/roles';
import { ROUTES } from '@/constants/routes';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { LanguageSwitcher } from '@/components/shared/LanguageSwitcher';
import { CurrencySwitcher } from '@/components/shared/CurrencySwitcher';
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
  const { t } = useTranslation();
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const user = useAuthStore(state => state.user);
  const { mutateAsync: logout, isPending: isLoggingOut } = useLogout();

  const initials = (user?.fullName || user?.email || 'US')
    .slice(0, 1)
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
              {t('nav.home')}
            </Link>
            <Link
              to="/deals"
              className={`hover:text-primary transition-colors ${location.pathname === '/deals' ? 'text-secondary font-bold' : ''}`}
            >
              {t('nav.deals')}
            </Link>
            <Link
              to="/destinations"
              className={`hover:text-primary transition-colors ${location.pathname === '/destinations' ? 'text-secondary font-bold' : ''}`}
            >
              {t('nav.destinations')}
            </Link>
            <Link
              to="/accommodation-types"
              className={`hover:text-primary transition-colors ${location.pathname === '/accommodation-types' ? 'text-secondary font-bold' : ''}`}
            >
              {t('nav.stays')}
            </Link>
            <CurrencySwitcher />
            <LanguageSwitcher />
          </div>
          <div className="flex items-center gap-3">
            <Link
              to={ROUTES.listYourProperty}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-role-partner-primary hover:bg-role-partner-light rounded-xl transition-colors"
            >
              <Store className="size-4" />
              {t('nav.listProperty')}
            </Link>
            {isAuthenticated && user ? (
              <>
                <NotificationBell />
                <DropdownMenu>
                  <DropdownMenuTrigger className="flex items-center gap-2 rounded-full p-1 pr-2 hover:bg-surface-container-low transition-colors outline-none cursor-pointer data-[state=open]:bg-surface-container-low">
                    {user.avatarUrl ? (
                      <img
                        src={user.avatarUrl}
                        alt={user?.fullName || 'User'}
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
                          alt={user?.fullName || 'User'}
                          className="size-10 rounded-full object-cover border border-outline-variant"
                        />
                      ) : (
                        <div className="size-10 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-bold text-sm">
                          {initials}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-on-surface truncate">
                          {user?.fullName || 'User'}
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
                          {t('nav.dashboard')}
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem asChild>
                      <Link to="/account/profile" className="cursor-pointer">
                        <UserIcon className="size-4" />
                        {t('nav.myAccount')}
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
                      {isLoggingOut ? t('nav.loggingOut') : t('nav.logout')}
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
                  {t('nav.login')}
                </Link>
                <Link
                  to="/register"
                  className="px-5 py-2 text-sm font-semibold bg-on-surface text-white rounded-xl hover:bg-primary transition-all text-center"
                >
                  {t('nav.register')}
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
