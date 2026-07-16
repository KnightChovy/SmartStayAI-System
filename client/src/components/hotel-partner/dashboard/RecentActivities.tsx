import { ArrowDownLeft, ArrowUpRight, Coins, Minus, RefreshCcw, Wallet } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { PartnerActivity } from '@/hooks/partner-dashboard';
import type { WalletTransactionType } from '@/types/hotel-revenue.types';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/formatDate';

interface RecentActivitiesProps {
  activities: PartnerActivity[];
  isLoading?: boolean;
}

const TXN_META: Record<
  WalletTransactionType,
  { icon: LucideIcon; label: string; wrap: string; color: string }
> = {
  earning: {
    icon: ArrowDownLeft,
    label: 'Earning',
    wrap: 'bg-emerald-50',
    color: 'text-emerald-600',
  },
  commission: { icon: Minus, label: 'Commission', wrap: 'bg-amber-50', color: 'text-amber-600' },
  payout: { icon: ArrowUpRight, label: 'Payout', wrap: 'bg-role-partner-light', color: 'text-role-partner-primary' },
  refund: { icon: RefreshCcw, label: 'Refund', wrap: 'bg-red-50', color: 'text-red-500' },
  adjustment: { icon: Coins, label: 'Adjustment', wrap: 'bg-slate-100', color: 'text-slate-500' },
};

function ActivitySkeleton() {
  return (
    <div className="flex items-start gap-3">
      <div className="w-7 h-7 rounded-full bg-slate-100 animate-pulse" />
      <div className="flex-1 space-y-2">
        <div className="h-3 w-40 bg-slate-100 rounded animate-pulse" />
        <div className="h-3 w-24 bg-slate-100 rounded animate-pulse" />
      </div>
    </div>
  );
}

export function RecentActivities({ activities, isLoading }: RecentActivitiesProps) {
  return (
    <div className="p-6 rounded-xl border border-slate-200 bg-white shadow-sm flex-1 transition-transform duration-300 hover:scale-102">
      <h3 className="text-base font-bold text-slate-900 mb-6">Recent Activities</h3>

      {isLoading ? (
        <div className="space-y-6">
          <ActivitySkeleton />
          <ActivitySkeleton />
          <ActivitySkeleton />
        </div>
      ) : activities.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mb-3">
            <Wallet className="w-5 h-5 text-slate-400" />
          </div>
          <p className="text-sm text-slate-500">No recent activity yet.</p>
        </div>
      ) : (
        <div className="relative border-l-2 border-slate-100 ml-3.5 space-y-7 pb-2">
          {activities.map(item => {
            const meta = TXN_META[item.type];
            const Icon = meta.icon;
            return (
              <div key={item.id} className="relative pl-6">
                <div
                  className={`absolute -left-3.5 top-0 w-7 h-7 rounded-full ${meta.wrap} flex items-center justify-center border-4 border-white`}
                >
                  <Icon className={`w-3 h-3 ${meta.color}`} />
                </div>
                <div className="flex justify-between items-start mb-1">
                  <p className="text-sm text-slate-900 font-bold">
                    {meta.label}{' '}
                    {item.hotelName && (
                      <span className="font-medium text-slate-500">· {item.hotelName}</span>
                    )}
                  </p>
                  <span className={`text-sm font-bold ${meta.color}`}>
                    {formatCurrency(item.amount)}
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium">
                  {item.description ?? '—'} {'•'} {formatDate(item.createdAt)}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
