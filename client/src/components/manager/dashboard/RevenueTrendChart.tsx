import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { formatCompactVnd, formatVndFull } from '@/utils/formatCurrency';
import type { DashboardTimeSeries } from '@/types/dashboard.types';
import { ChartCard } from './ChartCard';
import type { ChartTooltipProps } from './helpers';

interface RevenueTrendChartProps {
  data: DashboardTimeSeries | undefined;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}

function RevenueTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-lg text-xs">
      <p className="font-semibold text-slate-800 mb-1">{label}</p>
      <p className="text-slate-600">Revenue: {formatVndFull(payload[0]?.value ?? 0)}</p>
    </div>
  );
}

/** AC-1: Revenue trend (area) theo 12 tháng gần nhất. */
export function RevenueTrendChart({ data, isLoading, isError, onRetry }: RevenueTrendChartProps) {
  const points = data?.points ?? [];
  const isEmpty = points.every(p => p.revenue === 0);

  return (
    <ChartCard title="Revenue Trend (last 12 months)" isLoading={isLoading} isError={isError} isEmpty={isEmpty} onRetry={onRetry}>
      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={points} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <defs>
            <linearGradient id="dashRevGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#2563EB" stopOpacity={0.18} />
              <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="period" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={v => formatCompactVnd(v)} />
          <Tooltip content={<RevenueTooltip />} />
          <Area type="monotone" dataKey="revenue" stroke="#2563EB" strokeWidth={2.5} fill="url(#dashRevGrad)" name="Revenue" />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
