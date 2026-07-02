import { Link } from 'react-router';
import { Hotel, Users, CalendarCheck, TrendingUp, ArrowRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';
import { formatCompactVnd, formatVndFull } from '@/utils/formatCurrency';
import type { DashboardKpi, DashboardSummary } from '@/types/dashboard.types';
import { ChangeBadge } from '@/components/manager/analytics';
import { Sparkline } from './Sparkline';
import { formatCount } from './helpers';
import { KpiCardsSkeleton, SectionError } from './states';

interface DashboardKpiCardsProps {
  data: DashboardSummary | undefined;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}

interface CardMeta {
  label: string;
  icon: LucideIcon;
  color: string;
  bg: string;
  href: string;
  kpi: DashboardKpi;
  display: string;
  full?: string;
}

const trendOf = (change: number | null): 'up' | 'down' | 'flat' =>
  change === null || change === 0 ? 'flat' : change > 0 ? 'up' : 'down';

export function DashboardKpiCards({ data, isLoading, isError, onRetry }: DashboardKpiCardsProps) {
  if (isError) {
    return (
      <div className="bg-white rounded-xl border border-red-200">
        <SectionError onRetry={onRetry} />
      </div>
    );
  }
  if (isLoading || !data) {
    return <KpiCardsSkeleton />;
  }

  const { kpis } = data;
  const cards: CardMeta[] = [
    {
      label: 'Total Hotel Partners',
      icon: Hotel,
      color: 'text-role-manager-primary',
      bg: 'bg-role-manager-light',
      href: '/manager/hotel-partners',
      kpi: kpis.hotelPartners,
      display: formatCount(kpis.hotelPartners.value),
    },
    {
      label: 'Active Users',
      icon: Users,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      href: '/manager/analytics',
      kpi: kpis.activeUsers,
      display: formatCount(kpis.activeUsers.value),
    },
    {
      label: 'Bookings',
      icon: CalendarCheck,
      color: 'text-violet-600',
      bg: 'bg-violet-50',
      href: '/manager/analytics',
      kpi: kpis.bookings,
      display: formatCount(kpis.bookings.value),
    },
    {
      label: 'Platform Revenue',
      icon: TrendingUp,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      href: '/manager/revenue',
      kpi: kpis.revenue,
      display: formatCompactVnd(kpis.revenue.value),
      full: formatVndFull(kpis.revenue.value),
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map(c => {
        const Icon = c.icon;
        return (
          <Link
            key={c.label}
            to={c.href}
            className="group bg-white rounded-xl border border-slate-200 p-5 transition-all hover:border-role-manager-primary/40 hover:shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-role-manager-primary"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={cn('inline-flex p-2 rounded-lg', c.bg)}>
                <Icon className={cn('w-5 h-5', c.color)} />
              </div>
              <ChangeBadge value={c.kpi.changePct} />
            </div>
            <p className="text-2xl font-bold text-slate-900" title={c.full}>
              {c.display}
            </p>
            <div className="flex items-center justify-between mt-1">
              <p className="text-xs text-slate-500">{c.label}</p>
              <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-role-manager-primary transition-colors" />
            </div>
            <p className="text-[11px] text-slate-500 mt-2">vs previous period</p>
            <div className="mt-1">
              <Sparkline data={c.kpi.sparkline} trend={trendOf(c.kpi.changePct)} />
            </div>
          </Link>
        );
      })}
    </div>
  );
}
