import {
  BarChart3,
  Bot,
  Building2,
  CreditCard,
  X,
  LogOut,
  LayoutDashboard,
  Settings,
  ShieldAlert,
  Users,
} from 'lucide-react';
import { NavLink } from 'react-router';
import { cn } from '@/lib/utils';

const navItems = [
  { label: 'Dashboard', to: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Users', to: '/admin/users', icon: Users },
  { label: 'Payments', to: '/admin/payments', icon: CreditCard },
  { label: 'Analytics', to: '/admin/analytics', icon: BarChart3 },
  { label: 'AI Settings', to: '/admin/ai-settings', icon: Bot },
  { label: 'Properties', to: '/admin/properties', icon: Building2 },
  { label: 'System', to: '/admin/system', icon: ShieldAlert },
  { label: 'Settings', to: '/admin/settings', icon: Settings },
];

interface AdminSidebarProps {
  onClose?: () => void;
  onNavigate?: () => void;
  onOpenCalendar?: () => void;
}

export function AdminSidebar({
  onClose,
  onNavigate,
}: AdminSidebarProps) {
  return (
    <aside className="flex min-h-screen flex-col border-r border-outline-variant/40 bg-surface px-4 py-5">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex size-9 items-center justify-center bg-black text-sm font-semibold text-white">
          A
        </div>
        <p className="text-lg font-semibold">Smart Stay AI</p>
        {onClose ? (
          <button
            aria-label="Close admin sidebar"
            className="ml-auto inline-flex size-8 items-center justify-center rounded-full border border-outline-variant/40 text-slate-700 lg:hidden"
            onClick={onClose}
            type="button"
          >
            <X className="size-4" />
          </button>
        ) : null}
      </div>

      <nav className="space-y-1.5">
        {navItems.map(item => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onNavigate}
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
          onClick={onNavigate}
          type="button"
        >
          <LogOut className="size-4" />
          Logout
        </button>
      </div>
    </aside>
  );
}
