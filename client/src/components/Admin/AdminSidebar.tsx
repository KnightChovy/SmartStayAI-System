import {
  BarChart3,
  Building2,
  CalendarDays,
  LogOut,
  LayoutDashboard,
  Settings,
  Users,
} from 'lucide-react';
import { NavLink } from 'react-router';
import { cn } from '@/lib/utils';

const navItems = [
  { label: 'Dashboard', to: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Users', to: '/admin/users', icon: Users },
  { label: 'Analytics', to: '/admin/analytics', icon: BarChart3 },
  { label: 'Reports', to: '/admin/bookings', icon: CalendarDays },
  { label: 'Properties', to: '/admin/properties', icon: Building2 },
  { label: 'Settings', to: '/admin/settings', icon: Settings },
];

export function AdminSidebar() {
  return (
    <aside className="hidden min-h-screen border-r border-outline-variant/40 bg-surface px-4 py-5 lg:flex lg:flex-col">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex size-9 items-center justify-center bg-black text-sm font-semibold text-white">
          A
        </div>
        <p className="text-lg font-semibold">Smart Stay AI</p>
      </div>

      <nav className="space-y-1.5">
        {navItems.map(item => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2.5 rounded-full px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-slate-600 hover:bg-surface-container-low'
                )
              }
            >
              <Icon className="size-4" />
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      <div className="mt-auto space-y-2 border-t border-outline-variant/40 pt-4">
        <div className="rounded-full bg-surface-container-low px-3 py-2.5">
          <p className="text-sm font-semibold">Admin</p>
          <p className="text-xs text-muted-foreground">Administrator</p>
        </div>
        <button
          className="flex items-center gap-2 px-2 text-sm text-slate-700"
          type="button"
        >
          <LogOut className="size-4" />
          Logout
        </button>
      </div>
    </aside>
  );
}
