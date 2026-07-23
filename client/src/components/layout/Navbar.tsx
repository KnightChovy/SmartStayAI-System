import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router';
import { useTranslation } from 'react-i18next';
import {
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Menu,
  Store,
  User as UserIcon,
  X,
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

/** Mục điều hướng chính — dùng chung cho cả thanh desktop và menu mobile. */
const NAV_LINKS = [
  { to: '/', key: 'nav.home' },
  { to: '/deals', key: 'nav.deals' },
  { to: '/destinations', key: 'nav.destinations' },
] as const;

export default function Navbar() {
  const location = useLocation();
  const { t } = useTranslation();
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const user = useAuthStore(state => state.user);
  const { mutateAsync: logout, isPending: isLoggingOut } = useLogout();
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);
  const navRef = useRef<HTMLElement>(null);

  const initials = (user?.fullName || user?.email || 'US')
    .slice(0, 1)
    .toUpperCase();
  const dashboardPath = user ? getLandingPathForRole(user.role) : '/';
  const hasDashboard = dashboardPath !== '/';

  /**
   * Công bố chiều cao thật của navbar ra `--app-navbar-h` để các thanh sticky bên dưới
   * (vd `AnchorNav`) neo đúng mép dưới của nó. Không hardcode được: chiều cao là `py-4` cộng
   * phần tử cao nhất trong hàng (nút CTA / avatar) nên vượt 64px của `top-16`, và còn đổi theo
   * breakpoint — lệch bao nhiêu là thanh bên dưới chui xuống dưới navbar (z-index thấp hơn)
   * và bị cắt mất bấy nhiêu.
   */
  useEffect(() => {
    const el = navRef.current;
    if (!el) return;
    const publish = () =>
      document.documentElement.style.setProperty('--app-navbar-h', `${el.offsetHeight}px`);
    publish();
    const observer = new ResizeObserver(publish);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Mở menu thì khoá cuộn nền (drawer chiếm toàn màn hình trên mobile).
  useEffect(() => {
    if (!menuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [menuOpen]);

  return (
    <nav
      ref={navRef}
      className="bg-surface/80 backdrop-blur-xl sticky top-0 z-50 w-full border-b border-outline-variant/30"
    >
      <div className="max-w-7xl mx-auto px-margin-mobile md:px-8 py-4 flex justify-between items-center">
        <Link
          to="/"
          className="font-be-vietnam font-bold tracking-tight text-on-surface text-2xl"
        >
          Smart Stay AI
        </Link>
        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-6 text-sm font-semibold text-on-surface-variant">
            {NAV_LINKS.map(link => (
              <Link
                key={link.to}
                to={link.to}
                className={`hover:text-primary transition-colors ${location.pathname === link.to ? 'text-secondary font-bold' : ''}`}
              >
                {t(link.key)}
              </Link>
            ))}
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
              // Dưới sm chỉ giữ 1 CTA chính (Sign up) — 2 nút cạnh nhau làm tràn thanh nav
              // trên máy hẹp; Sign in đã có trong menu hamburger.
              <>
                <Link
                  to="/login"
                  className="hidden sm:block px-5 py-2 text-sm font-semibold text-on-surface hover:bg-surface-container-low rounded-xl transition-all text-center"
                >
                  {t('nav.login')}
                </Link>
                <Link
                  to="/register"
                  className="px-4 sm:px-5 py-2 text-sm font-semibold bg-on-surface text-white rounded-xl hover:bg-primary transition-all text-center"
                >
                  {t('nav.register')}
                </Link>
              </>
            )}

            {/* Hamburger — chỉ hiện dưới md, nơi thanh link ngang bị ẩn */}
            <button
              type="button"
              onClick={() => setMenuOpen(o => !o)}
              aria-label={menuOpen ? t('nav.closeMenu') : t('nav.openMenu')}
              aria-expanded={menuOpen}
              aria-controls="mobile-nav"
              className="md:hidden inline-flex size-11 items-center justify-center rounded-xl text-on-surface hover:bg-surface-container-low transition-colors"
            >
              {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Menu mobile: danh sách mục điều hướng + tiện ích, mở từ nút hamburger */}
      {menuOpen && (
        <div
          id="mobile-nav"
          className="md:hidden border-t border-outline-variant/30 bg-surface"
        >
          <div className="px-margin-mobile py-3 flex flex-col">
            {NAV_LINKS.map(link => (
              <Link
                key={link.to}
                to={link.to}
                onClick={closeMenu}
                className={`flex min-h-11 items-center rounded-xl px-3 text-sm font-semibold transition-colors hover:bg-surface-container-low ${
                  location.pathname === link.to
                    ? 'text-secondary font-bold'
                    : 'text-on-surface-variant'
                }`}
              >
                {t(link.key)}
              </Link>
            ))}

            <Link
              to={ROUTES.listYourProperty}
              onClick={closeMenu}
              className="flex min-h-11 items-center gap-1.5 rounded-xl px-3 text-sm font-semibold text-role-partner-primary hover:bg-role-partner-light transition-colors sm:hidden"
            >
              <Store className="size-4" />
              {t('nav.listProperty')}
            </Link>

            {!isAuthenticated && (
              <Link
                to="/login"
                onClick={closeMenu}
                className="flex min-h-11 items-center rounded-xl px-3 text-sm font-semibold text-on-surface hover:bg-surface-container-low transition-colors sm:hidden"
              >
                {t('nav.login')}
              </Link>
            )}

            <div className="mt-2 flex items-center gap-3 border-t border-outline-variant/30 px-3 pt-3">
              <CurrencySwitcher />
              <LanguageSwitcher />
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
