import { Gift, Sparkles, TrendingDown, TrendingUp } from 'lucide-react';
import { useLoyalty } from '@/hooks/account/use-account';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDateShort } from '@/utils/formatDate';
import { cn } from '@/lib/cn';
import type { LoyaltyTier } from '@/types/account.types';

const TIER_ORDER: LoyaltyTier[] = ['bronze', 'silver', 'gold', 'platinum'];
const TIER_THRESHOLD: Record<LoyaltyTier, number> = {
  bronze: 0,
  silver: 2000,
  gold: 5000,
  platinum: 10000,
};
const TIER_STYLE: Record<LoyaltyTier, string> = {
  bronze: 'from-amber-700 to-amber-500',
  silver: 'from-slate-400 to-slate-300',
  gold: 'from-yellow-500 to-amber-400',
  platinum: 'from-slate-700 to-slate-500',
};

export default function LoyaltyPage() {
  const { data, isLoading } = useLoyalty();

  if (isLoading || !data) {
    return <Skeleton className="h-64 w-full rounded-3xl" />;
  }

  const tierIndex = TIER_ORDER.indexOf(data.tier);
  const nextTier = TIER_ORDER[tierIndex + 1];
  const nextThreshold = nextTier ? TIER_THRESHOLD[nextTier] : null;
  const progress = nextThreshold
    ? Math.min(100, Math.round((data.totalPoints / nextThreshold) * 100))
    : 100;

  return (
    <div>
      <h2 className="font-be-vietnam text-2xl font-bold text-on-surface">Loyalty rewards</h2>

      {/* Tier card */}
      <div
        className={cn(
          'mt-5 overflow-hidden rounded-3xl bg-gradient-to-br p-6 text-white shadow-lg',
          TIER_STYLE[data.tier]
        )}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="flex items-center gap-1.5 text-sm font-medium uppercase tracking-wider opacity-90">
              <Sparkles className="size-4" /> {data.tier} member
            </p>
            <p className="mt-2 font-be-vietnam text-4xl font-bold">{data.totalPoints.toLocaleString()}</p>
            <p className="text-sm opacity-90">points available</p>
          </div>
          <Gift className="size-12 opacity-80" />
        </div>

        {nextTier && nextThreshold && (
          <div className="mt-6">
            <div className="mb-1.5 flex justify-between text-xs font-medium opacity-90">
              <span>{data.tier}</span>
              <span>
                {nextThreshold - data.totalPoints} pts to {nextTier}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/30">
              <div className="h-full rounded-full bg-white" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}
      </div>

      {/* Transactions */}
      <h3 className="mt-8 font-be-vietnam text-lg font-semibold text-on-surface">Points history</h3>
      <ul className="mt-4 divide-y divide-outline-variant/20 rounded-2xl border border-outline-variant/30 bg-surface">
        {data.transactions.map(tx => {
          const positive = tx.points >= 0;
          return (
            <li key={tx.id} className="flex items-center justify-between gap-3 px-5 py-4">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'flex size-9 items-center justify-center rounded-full',
                    positive ? 'bg-emerald-500/15 text-emerald-600' : 'bg-error/15 text-error'
                  )}
                >
                  {positive ? <TrendingUp className="size-4" /> : <TrendingDown className="size-4" />}
                </div>
                <div>
                  <p className="text-sm font-medium text-on-surface">{tx.description}</p>
                  <p className="text-xs text-on-surface-variant">{formatDateShort(tx.createdAt)}</p>
                </div>
              </div>
              <span className={cn('font-semibold', positive ? 'text-emerald-600' : 'text-error')}>
                {positive ? '+' : ''}
                {tx.points.toLocaleString()}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
