import { Info, TrendingUp, Percent, CalendarCheck, BarChart3 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/cn';
import { formatCompactVnd, formatVndFull } from '@/utils/formatCurrency';
import type { RevenueSummary } from '@/types/revenue.types';
import { ChangeBadge } from './ChangeBadge';
import { SectionError } from './states';

interface RevenueKpiCardsProps {
  data: RevenueSummary | undefined;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}

interface CardMeta {
  label: string;
  icon: LucideIcon;
  color: string;
  bg: string;
  hint: string;
  compact: string;
  full: string | null;
  changePct: number | null;
}

export function RevenueKpiCards({ data, isLoading, isError, onRetry }: RevenueKpiCardsProps) {
  if (isError) {
    return <SectionError onRetry={onRetry} />;
  }

  if (isLoading || !data) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-200 p-5 animate-pulse">
            <div className="w-9 h-9 rounded-lg bg-slate-100 mb-3" />
            <div className="h-7 w-2/3 bg-slate-100 rounded mb-2" />
            <div className="h-3 w-1/2 bg-slate-100 rounded mb-3" />
            <div className="h-4 w-24 bg-slate-100 rounded" />
          </div>
        ))}
      </div>
    );
  }

  const { kpis } = data;
  const cards: CardMeta[] = [
    {
      label: 'Total Platform Revenue',
      icon: TrendingUp,
      color: 'text-role-manager-primary',
      bg: 'bg-role-manager-light',
      hint: 'Total value of confirmed bookings (confirmed / checked-in / checked-out) within the selected period.',
      compact: formatCompactVnd(kpis.grossRevenue.value),
      full: formatVndFull(kpis.grossRevenue.value),
      changePct: kpis.grossRevenue.changePct,
    },
    {
      label: 'Total Commission',
      icon: Percent,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      hint: 'Platform commission recognised in the period (pending + settled; disputed excluded).',
      compact: formatCompactVnd(kpis.totalCommission.value),
      full: formatVndFull(kpis.totalCommission.value),
      changePct: kpis.totalCommission.changePct,
    },
    {
      label: 'Avg. Commission Rate',
      icon: BarChart3,
      color: 'text-violet-600',
      bg: 'bg-violet-50',
      hint: 'Average commission rate = Total commission / Total revenue × 100.',
      compact: `${kpis.avgCommissionRate.value}%`,
      full: null,
      changePct: kpis.avgCommissionRate.changePct,
    },
    {
      label: 'Bookings',
      icon: CalendarCheck,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      hint: 'Number of confirmed / checked-in / checked-out bookings in the period. The API does not return the previous-period count, so no change is shown.',
      compact: kpis.bookings.value.toLocaleString('vi-VN'),
      full: null,
      changePct: kpis.bookings.changePct,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map(c => {
        const Icon = c.icon;
        return (
          <div key={c.label} className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className={cn('p-2 rounded-lg', c.bg)}>
                <Icon className={cn('w-5 h-5', c.color)} />
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button type="button" className="text-slate-300 hover:text-slate-500 transition-colors">
                    <Info className="w-4 h-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-56 text-xs">{c.hint}</TooltipContent>
              </Tooltip>
            </div>

            {c.full ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <p className="text-2xl font-bold text-slate-900 cursor-default w-fit">
                    {c.compact}
                  </p>
                </TooltipTrigger>
                <TooltipContent>{c.full}</TooltipContent>
              </Tooltip>
            ) : (
              <p className="text-2xl font-bold text-slate-900">{c.compact}</p>
            )}

            <p className="text-xs text-slate-500 mt-1">{c.label}</p>
            <div className="flex items-center gap-1.5 mt-3">
              <ChangeBadge value={c.changePct} />
              <span className="text-xs text-slate-400">vs previous period</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
