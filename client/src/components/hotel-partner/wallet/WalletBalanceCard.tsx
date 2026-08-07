import { Clock, TrendingUp, Wallet } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useHotelRevenue } from '@/hooks/hotel-revenue';
import { cn } from '@/lib/cn';
import { formatCurrency } from '@/utils/formatCurrency';
import type { HotelWalletBalance } from '@/types/hotel-revenue.types';

interface WalletBalanceCardProps {
  hotelId: string;
  wallet: HotelWalletBalance | undefined;
  isLoading: boolean;
}

export function WalletBalanceCard({
  hotelId,
  wallet,
  isLoading,
}: WalletBalanceCardProps) {
  const lifetime = useHotelRevenue(hotelId);
  const totalEarned = lifetime.data?.summary.netAfterRefund;

  return (
    <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-6">
      <Wallet
        aria-hidden
        className="pointer-events-none absolute -right-6 top-4 h-32 w-32 text-slate-100"
      />

      <div className="relative space-y-5">
        <Figure
          icon={Wallet}
          label="Available balance"
          value={wallet?.balanceAvailable}
          hint="Settled — this is what a payout can draw from."
          loading={isLoading && !wallet}
          tone="text-emerald-600"
          size="lg"
        />

        <div className="border-t border-slate-100 pt-5">
          <Figure
            icon={Clock}
            label="Pending balance"
            value={wallet?.balancePending}
            hint="Earned but not settled yet, e.g. guests still to check out."
            loading={isLoading && !wallet}
            tone="text-amber-600"
          />
        </div>

        <div className="border-t border-slate-100 pt-5">
          <Figure
            icon={TrendingUp}
            label="Total earned (all time)"
            value={totalEarned}
            hint="Net revenue after platform commission and refunds, across your whole history."
            loading={lifetime.isLoading && !totalEarned}
            tone="text-slate-800"
          />
        </div>
      </div>
    </div>
  );
}

function Figure({
  icon: Icon,
  label,
  value,
  hint,
  loading,
  tone,
  size = 'md',
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | undefined;
  hint: string;
  loading: boolean;
  tone: string;
  size?: 'md' | 'lg';
}) {
  return (
    <div>
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-slate-400" />
        <span className="text-sm font-medium text-slate-600">{label}</span>
      </div>
      {loading ? (
        <Skeleton
          className={cn('mt-2', size === 'lg' ? 'h-9 w-44' : 'h-7 w-36')}
        />
      ) : (
        <p
          className={cn(
            'mt-1 font-bold tracking-tight tabular-nums',
            size === 'lg' ? 'text-3xl' : 'text-xl',
            tone
          )}
        >
          {formatCurrency(value)}
        </p>
      )}
      <p className="mt-1.5 text-xs text-slate-400">{hint}</p>
    </div>
  );
}
