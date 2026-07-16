import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { UsersGrowthSeries } from '@/types/dashboard.types';
import { ChartCard } from './ChartCard';
import { formatCount, type ChartTooltipProps } from './helpers';

interface UsersGrowthChartProps {
  data: UsersGrowthSeries | undefined;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}

function UsersTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-lg text-xs">
      <p className="font-semibold text-slate-800 mb-1">{label}</p>
      <p className="text-slate-600">New users: {formatCount(Number(payload[0]?.value ?? 0))}</p>
    </div>
  );
}

/**
 * Người dùng MỚI theo tháng (`GET /platform-manager/analytics`).
 *
 * Tiêu đề ghi rõ "last 12 months" vì endpoint KHÔNG nhận from/to — chart này cố tình không
 * đi theo date-range picker, và người xem cần biết điều đó thay vì tưởng nó đã lọc.
 */
export function UsersGrowthChart({ data, isLoading, isError, onRetry }: UsersGrowthChartProps) {
  const points = data?.points ?? [];
  const isEmpty = points.every(p => p.newUsers === 0);

  return (
    <ChartCard
      title="New Users (last 12 months)"
      isLoading={isLoading}
      isError={isError}
      isEmpty={isEmpty}
      onRetry={onRetry}
    >
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={points} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
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
            allowDecimals={false}
          />
          <Tooltip content={<UsersTooltip />} />
          <Line
            type="monotone"
            dataKey="newUsers"
            stroke="#10b981"
            strokeWidth={2.5}
            dot={{ r: 3 }}
            name="New Users"
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
