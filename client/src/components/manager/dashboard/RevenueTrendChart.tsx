import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
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
      {payload.map(p => (
        <p key={p.dataKey} className="text-slate-600">
          {p.name}: {formatVndFull(p.value ?? 0)}
        </p>
      ))}
    </div>
  );
}

/**
 * Doanh thu theo khoảng đang chọn (`GET /admin/revenue`).
 *
 * Vẽ HAI đường vì đây là hai loại tiền khác hẳn nhau và chênh nhau nhiều lần:
 * GMV là tiền khách trả cho khách sạn, còn platform revenue là hoa hồng sàn thực thu.
 */
export function RevenueTrendChart({ data, isLoading, isError, onRetry }: RevenueTrendChartProps) {
  const points = data?.points ?? [];
  const isEmpty = points.every(p => p.gmv === 0 && p.netRevenue === 0);

  return (
    <ChartCard
      title="Revenue Trend"
      isLoading={isLoading}
      isError={isError}
      isEmpty={isEmpty}
      onRetry={onRetry}
    >
      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={points} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <defs>
            <linearGradient id="dashGmvGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.16} />
              <stop offset="95%" stopColor="#94a3b8" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="dashRevGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#2563EB" stopOpacity={0.18} />
              <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis
            dataKey="period"
            tick={{ fontSize: 11, fill: '#64748b' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#64748b' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={v => formatCompactVnd(v)}
          />
          <Tooltip content={<RevenueTooltip />} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Area
            type="monotone"
            dataKey="gmv"
            stroke="#94a3b8"
            strokeWidth={2}
            fill="url(#dashGmvGrad)"
            name="Gross booking value"
          />
          <Area
            type="monotone"
            dataKey="netRevenue"
            stroke="#2563EB"
            strokeWidth={2.5}
            fill="url(#dashRevGrad)"
            name="Platform revenue"
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
