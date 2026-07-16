import { NavLink } from 'react-router';
import { useTranslation } from 'react-i18next';
import {
  Bell,
  CalendarCheck,
  Gift,
  MessageSquare,
  Settings,
  Star,
  Ticket,
  UserCircle,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import { cn } from '@/lib/cn';

interface NavItem {
  to: string;
  labelKey:
    | 'nav.profile'
    | 'nav.bookings'
    | 'nav.messages'
    | 'nav.reviews'
    | 'nav.loyalty'
    | 'nav.vouchers'
    | 'nav.notifications'
    | 'nav.settings';
  icon: LucideIcon;
}

const NAV_ITEMS: NavItem[] = [
  { to: ROUTES.accountProfile, labelKey: 'nav.profile', icon: UserCircle },
  { to: ROUTES.accountBookings, labelKey: 'nav.bookings', icon: CalendarCheck },
  { to: ROUTES.accountMessages, labelKey: 'nav.messages', icon: MessageSquare },
  { to: ROUTES.accountReviews, labelKey: 'nav.reviews', icon: Star },
  { to: ROUTES.accountLoyalty, labelKey: 'nav.loyalty', icon: Gift },
  { to: ROUTES.accountVouchers, labelKey: 'nav.vouchers', icon: Ticket },
  { to: ROUTES.accountNotifications, labelKey: 'nav.notifications', icon: Bell },
  { to: ROUTES.accountSettings, labelKey: 'nav.settings', icon: Settings },
];

/** Sidebar điều hướng khu tài khoản (sticky bên trái trên desktop). */
export default function AccountSidebar() {
  const { t } = useTranslation('account');
  return (
    <nav className="flex gap-1 overflow-x-auto md:flex-col md:gap-1 md:overflow-visible">
      {NAV_ITEMS.map(({ to, labelKey, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end
          className={({ isActive }) =>
            cn(
              'flex shrink-0 items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-colors',
              isActive
                ? 'bg-primary/10 text-primary'
                : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
            )
          }
        >
          <Icon className="size-5" />
          {t(labelKey)}
        </NavLink>
      ))}
    </nav>
  );
}
