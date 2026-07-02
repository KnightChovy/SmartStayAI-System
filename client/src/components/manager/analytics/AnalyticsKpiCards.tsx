import { CalendarCheck, CheckCircle2, TrendingUp, Users, Info } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { PlatformAnalytics } from '@/types/analytics.types';
import { ChangeBadge } from './ChangeBadge';
import {
  SMALL_SAMPLE,
  conversionChange,
  formatNumber,
  formatPercent,
  periodChange,
} from './helpers';

interface AnalyticsKpiCardsProps {
  totals: PlatformAnalytics['totals'];
  timeSeries: PlatformAnalytics['timeSeries'];
  period: 'month' | 'year';
}

interface KpiCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  color: string;
  bg: string;
  change: number | null;
  compareLabel: string;
  note?: string;
  warn?: boolean;
}

export function AnalyticsKpiCards({ totals, timeSeries, period }: AnalyticsKpiCardsProps) {
  const compareLabel = period === 'year' ? 'vs previous year' : 'vs previous month';
  const smallSample = totals.totalBookings > 0 && totals.totalBookings < SMALL_SAMPLE;

  const kpis: KpiCardProps[] = [
    {
      label: 'Total Bookings',
      value: formatNumber(totals.totalBookings),
      icon: CalendarCheck,
      color: 'text-role-manager-primary',
      bg: 'bg-role-manager-light',
      change: periodChange(timeSeries, 'bookings'),
      compareLabel,
    },
    {
      label: 'Confirmed Bookings',
      value: formatNumber(totals.confirmedBookings),
      icon: CheckCircle2,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      change: periodChange(timeSeries, 'confirmedBookings'),
      compareLabel,
    },
    {
      label: 'Conversion Rate',
      value: formatPercent(totals.conversionRate),
      icon: TrendingUp,
      color: 'text-violet-600',
      bg: 'bg-violet-50',
      change: conversionChange(timeSeries),
      compareLabel,
      // A3: kèm cỡ mẫu + cảnh báo khi mẫu quá nhỏ
      note: `based on ${formatNumber(totals.totalBookings)} booking${totals.totalBookings === 1 ? '' : 's'}`,
      warn: smallSample,
    },
    {
      label: 'Total Users',
      value: formatNumber(totals.totalUsers),
      icon: Users,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      change: periodChange(timeSeries, 'newUsers'),
      compareLabel,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map(k => (
        <KpiCard key={k.label} {...k} />
      ))}
    </div>
  );
}

function KpiCard({ label, value, icon: Icon, color, bg, change, compareLabel, note, warn }: KpiCardProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-center justify-between mb-3">
        <div className={cn('inline-flex p-2 rounded-lg', bg)}>
          <Icon className={cn('w-5 h-5', color)} />
        </div>
        <ChangeBadge value={change} />
      </div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-xs text-slate-500 mt-1">{label}</p>
      <div className="mt-2 flex items-center gap-1.5 min-h-4">
        {note ? (
          <span className={cn('inline-flex items-center gap-1 text-xs', warn ? 'text-amber-600' : 'text-slate-400')}>
            {warn && <Info className="w-3 h-3" />}
            {note}
          </span>
        ) : (
          <span className="text-xs text-slate-400">{compareLabel}</span>
        )}
      </div>
    </div>
  );
}
