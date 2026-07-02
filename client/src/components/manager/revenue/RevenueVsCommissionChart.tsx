import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { GitCompareArrows } from 'lucide-react';
import { cn } from '@/lib/cn';
import { formatCompactVnd, formatVndFull } from '@/utils/formatCurrency';
import type { RevenueTimeSeries } from '@/types/revenue.types';
import type { ChartTooltipProps } from './chart-tooltip';
import { ChartSkeleton, SectionEmpty, SectionError } from './states';

interface RevenueVsCommissionChartProps {
  data: RevenueTimeSeries | undefined;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  compare: boolean;
  onToggleCompare: () => void;
}

/** Tooltip hiện Revenue + Commission (+ kỳ trước) với số VND đầy đủ và mốc thời gian — AC-5.2. */
function ChartTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-lg text-xs">
      <p className="font-semibold text-slate-800 mb-1">{label}</p>
      {payload.map(entry => (
        <div key={entry.dataKey} className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full" style={{ background: entry.color }} />
          <span className="text-slate-500">{entry.name}:</span>
          <span className="font-medium text-slate-800">{formatVndFull(entry.value ?? 0)}</span>
        </div>
      ))}
    </div>
  );
}

export function RevenueVsCommissionChart({
  data,
  isLoading,
  isError,
  onRetry,
  compare,
  onToggleCompare,
}: RevenueVsCommissionChartProps) {
  const hasData = !!data && data.points.some(p => Number(p.revenue) > 0 || Number(p.commission) > 0);

  const chartData = (data?.points ?? []).map(p => ({
    period: p.period,
    revenue: Number(p.revenue),
    commission: Number(p.commission),
    previousRevenue: p.previousRevenue !== undefined ? Number(p.previousRevenue) : undefined,
  }));

  return (
    <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-semibold text-slate-900">Revenue vs Commission</h2>
        <button
          type="button"
          onClick={onToggleCompare}
          className={cn(
            'flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors',
            compare
              ? 'bg-role-manager-light text-role-manager-primary'
              : 'text-slate-500 hover:bg-slate-100'
          )}
        >
          <GitCompareArrows className="w-3.5 h-3.5" />
          Compare previous
        </button>
      </div>

      {isError ? (
        <SectionError onRetry={onRetry} />
      ) : isLoading || !data ? (
        <ChartSkeleton />
      ) : !hasData ? (
        <SectionEmpty />
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="period" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <YAxis
              yAxisId="left"
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={v => formatCompactVnd(v)}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={v => formatCompactVnd(v)}
            />
            <Tooltip content={<ChartTooltip />} />
            <Legend />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="revenue"
              stroke="#2563EB"
              strokeWidth={2.5}
              dot={{ r: 3 }}
              name="Revenue"
            />
            {compare && (
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="previousRevenue"
                stroke="#93C5FD"
                strokeWidth={2}
                strokeDasharray="5 4"
                dot={false}
                name="Revenue (previous)"
              />
            )}
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="commission"
              stroke="#10b981"
              strokeWidth={2.5}
              dot={{ r: 3 }}
              name="Commission"
            />
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
