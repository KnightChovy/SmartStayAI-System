import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { PlatformAnalyticsTimePoint } from '@/types/analytics.types';

interface AdminDashboardGrowthChartProps {
  data: PlatformAnalyticsTimePoint[];
  isLoading?: boolean;
}

function formatPeriodLabel(period: string): string {
  const [year, month] = period.split('-');
  if (!month) return period;
  return `${month}/${year.slice(2)}`;
}

export function AdminDashboardGrowthChart({
  data,
  isLoading,
}: AdminDashboardGrowthChartProps) {
  const chartData = data.map(point => ({
    month: formatPeriodLabel(point.period),
    users: point.newUsers,
  }));

  const first = chartData[0]?.users ?? 0;
  const last = chartData[chartData.length - 1]?.users ?? 0;
  const growth = first > 0 ? ((last - first) / first) * 100 : null;

  return (
    <div className="rounded-sm border bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">Monthly User Growth</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            New users across the last {chartData.length || 0} months
          </p>
        </div>
        {growth !== null && (
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-bold ${
              growth >= 0
                ? 'bg-emerald-50 text-emerald-600'
                : 'bg-red-50 text-red-600'
            }`}
          >
            {growth >= 0 ? '+' : ''}
            {growth.toFixed(1)}%
          </span>
        )}
      </div>
      <div className="mt-4 h-70 rounded-sm border bg-slate-50 p-3">
        {isLoading ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Loading...
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            No data yet
          </div>
        ) : (
          <ResponsiveContainer height="100%" width="100%">
            <AreaChart
              data={chartData}
              margin={{ bottom: 0, left: -18, right: 8, top: 12 }}
            >
              <defs>
                <linearGradient id="userGrowthFill" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.28} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid
                stroke="#e2e8f0"
                strokeDasharray="4 4"
                vertical={false}
              />
              <XAxis
                axisLine={false}
                dataKey="month"
                tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
                tickLine={false}
              />
              <YAxis
                axisLine={false}
                tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  border: '1px solid #e2e8f0',
                  borderRadius: '14px',
                  boxShadow: '0 16px 40px rgba(15, 23, 42, 0.12)',
                }}
                formatter={value => [
                  `${Number(value).toLocaleString()} users`,
                  'New users',
                ]}
                labelStyle={{ color: '#0f172a', fontWeight: 700 }}
              />
              <Area
                activeDot={{
                  fill: '#2563eb',
                  r: 5,
                  stroke: '#ffffff',
                  strokeWidth: 2,
                }}
                dataKey="users"
                fill="url(#userGrowthFill)"
                stroke="#2563eb"
                strokeWidth={3}
                type="monotone"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
