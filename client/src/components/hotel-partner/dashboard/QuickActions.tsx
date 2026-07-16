import { PlusCircle, Package, TrendingUp, Hotel } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useNavigate } from 'react-router';

interface QuickAction {
  icon: LucideIcon;
  label: string;
  to: string;
  primary?: boolean;
}

const ACTIONS: QuickAction[] = [
  { icon: PlusCircle, label: 'Add Room', to: '/partner/room-inventory', primary: true },
  { icon: Package, label: 'Update Room Inventory', to: '/partner/room-inventory' },
  { icon: TrendingUp, label: 'View Revenue', to: '/partner/revenue', primary: true },
  { icon: Hotel, label: 'Manage Hotel', to: '/partner/hotel-management' },
];

export function QuickActions() {
  const navigate = useNavigate();

  return (
    <div className="p-6 rounded-xl border border-slate-200 bg-white shadow-sm mb-6">
      <h3 className="text-base font-bold text-slate-900 mb-5">Quick Actions</h3>
      <div className="grid grid-cols-2 gap-3">
        {ACTIONS.map(action => {
          const Icon = action.icon;
          return (
            <button
              key={action.label}
              type="button"
              onClick={() => navigate(action.to)}
              className={
                action.primary
                  ? 'flex flex-col items-center justify-center py-5 px-2 rounded-xl bg-role-partner-light/50 hover:bg-role-partner-light border border-role-partner-light transition-colors cursor-pointer duration-300 hover:scale-105'
                  : 'flex flex-col items-center justify-center py-5 px-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-100 transition-colors cursor-pointer duration-300 hover:scale-105'
              }
            >
              <div
                className={`w-8 h-8 rounded-full bg-white flex items-center justify-center mb-3 shadow-sm border ${
                  action.primary
                    ? 'text-role-partner-primary border-role-partner-light'
                    : 'text-slate-600 border-slate-100'
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-700 text-center">{action.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
