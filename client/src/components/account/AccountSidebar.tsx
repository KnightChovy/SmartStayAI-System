import { NavLink } from 'react-router';
import {
  Bell,
  CalendarCheck,
  Gift,
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
  label: string;
  icon: LucideIcon;
}

const NAV_ITEMS: NavItem[] = [
  { to: ROUTES.accountProfile, label: 'Profile', icon: UserCircle },
  { to: ROUTES.accountBookings, label: 'My bookings', icon: CalendarCheck },
  { to: ROUTES.accountReviews, label: 'My reviews', icon: Star },
  { to: ROUTES.accountLoyalty, label: 'Loyalty', icon: Gift },
  { to: ROUTES.accountVouchers, label: 'Vouchers', icon: Ticket },
  { to: ROUTES.accountNotifications, label: 'Notifications', icon: Bell },
  { to: ROUTES.accountSettings, label: 'Settings', icon: Settings },
];

/** Sidebar điều hướng khu tài khoản (sticky bên trái trên desktop). */
export default function AccountSidebar() {
  return (
    <nav className="flex gap-1 overflow-x-auto md:flex-col md:gap-1 md:overflow-visible">
      {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
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
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
