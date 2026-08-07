import { ArrowDown, Clock, HandCoins, Wallet } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/cn';
import { formatCurrency } from '@/utils/formatCurrency';
import type { HotelWalletBalance } from '@/types/hotel-revenue.types';

interface WalletBalanceCardProps {
  wallet: HotelWalletBalance | undefined;
  isLoading: boolean;
}

/**
 * Ba số dư của ví, xếp theo đúng **chặng đường của đồng tiền** chứ không phải ba ô ngang hàng:
 *
 *   Pending settlement  →  Available  →  Pending payout
 *
 * Mũi tên giữa các chặng là có chủ đích: đọc từ trên xuống là hiểu tiền đi đâu, thay vì phải
 * tự đoán vì sao có ba con số khác nhau. "Available" được làm nổi vì đó là số **hành động
 * được** (rút được ngay); hai số kia là trạng thái chờ.
 */
export function WalletBalanceCard({
  wallet,
  isLoading,
}: WalletBalanceCardProps) {
  const loading = isLoading && !wallet;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <Figure
        icon={Clock}
        label="Pending settlement"
        value={wallet?.balancePending}
        hint="Guests have paid, but they have not finished their stay yet. It moves to Available automatically once the stay is closed."
        loading={loading}
        tone="text-amber-600"
      />

      <Arrow />

      <Figure
        icon={Wallet}
        label="Available for payout"
        value={wallet?.balanceAvailable}
        hint="Settled and yours to take out. Requesting a payout draws from this balance."
        loading={loading}
        tone="text-emerald-600"
        emphasis
      />

      <Arrow />

      <Figure
        icon={HandCoins}
        label="Pending payout"
        value={wallet?.pendingPayout}
        hint="Payout requests you have already submitted. This amount has left Available and is waiting for the platform to transfer it."
        loading={loading}
        tone="text-blue-600"
      />
    </div>
  );
}

/** Nối 3 chặng — nói ra rằng đây là MỘT dòng tiền, không phải ba khoản rời rạc. */
function Arrow() {
  return (
    <div className="flex items-center gap-2 py-3 pl-1.5" aria-hidden>
      <ArrowDown className="h-3.5 w-3.5 text-slate-300" />
      <span className="h-px flex-1 bg-slate-100" />
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
  emphasis = false,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | undefined;
  hint: string;
  loading: boolean;
  tone: string;
  emphasis?: boolean;
}) {
  return (
    <div>
      <div className="flex items-center gap-2">
        <Icon className={cn('h-4 w-4', emphasis ? tone : 'text-slate-400')} />
        <Tooltip>
          <TooltipTrigger asChild>
            <span
              className={cn(
                'cursor-default text-sm',
                emphasis
                  ? 'font-semibold text-slate-800'
                  : 'font-medium text-slate-600'
              )}
            >
              {label}
            </span>
          </TooltipTrigger>
          <TooltipContent className="max-w-64 text-xs">{hint}</TooltipContent>
        </Tooltip>
      </div>
      {loading ? (
        <Skeleton className={cn('mt-2', emphasis ? 'h-9 w-44' : 'h-7 w-36')} />
      ) : (
        <p
          className={cn(
            'mt-1 font-bold tracking-tight tabular-nums',
            emphasis ? 'text-3xl' : 'text-xl',
            tone
          )}
        >
          {formatCurrency(value)}
        </p>
      )}
    </div>
  );
}
