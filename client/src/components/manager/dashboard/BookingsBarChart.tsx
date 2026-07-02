import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { DashboardTimeSeries } from '@/types/dashboard.types';
import { ChartCard } from './ChartCard';
import { formatCount, type ChartTooltipProps } from './helpers';

interface BookingsBarChartProps {
  data: DashboardTimeSeries | undefined;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}

function BookingsTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-lg text-xs">
      <p className="font-semibold text-slate-800 mb-1">{label}</p>
      <p className="text-slate-600">Bookings: {formatCount(Number(payload[0]?.value ?? 0))}</p>
    </div>
  );
}

/** AC-1: Bookings theo thời gian (bar). */
export function BookingsBarChart({ data, isLoading, isError, onRetry }: BookingsBarChartProps) {
  const points = data?.points ?? [];
  const isEmpty = points.every(p => p.bookings === 0);

  return (
    <ChartCard title="Bookings Over Time" isLoading={isLoading} isError={isError} isEmpty={isEmpty} onRetry={onRetry}>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={points} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="period" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip content={<BookingsTooltip />} cursor={{ fill: '#f8fafc' }} />
          <Bar dataKey="bookings" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Bookings" />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
