import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatCompactVnd, formatVndFull } from '@/utils/formatCurrency';
import type { AdminRevenueSeriesPoint } from '@/types/admin.types';

interface AdminRevenueChartProps {
  series: AdminRevenueSeriesPoint[];
  isLoading: boolean;
}

interface TooltipItem {
  name?: string;
  value?: number;
  color?: string;
  dataKey?: string;
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipItem[];
  label?: string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-xl border border-blue-100 bg-white px-3 py-2 text-xs shadow-lg">
      <p className="mb-1 font-bold text-slate-950">{label}</p>
      {payload.map(entry => (
        <div className="flex items-center gap-2" key={entry.dataKey}>
          <span
            className="inline-block size-2 rounded-full"
            style={{ background: entry.color }}
          />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="font-semibold text-slate-950">
            {formatVndFull(entry.value ?? 0)}
          </span>
        </div>
      ))}
    </div>
  );
}

export function AdminRevenueChart({ series, isLoading }: AdminRevenueChartProps) {
  const chartData = series.map(point => ({
    period: point.period,
    gmv: Number(point.gmv),
    netPlatformRevenue: Number(point.netPlatformRevenue),
  }));
  const hasData = chartData.some(p => p.gmv > 0 || p.netPlatformRevenue > 0);

  return (
    <div className="rounded-2xl border bg-white p-4 sm:p-6">
      <div>
        <h2 className="text-xl font-bold sm:text-2xl">GMV vs Net Platform Revenue</h2>
        <p className="text-sm text-muted-foreground sm:text-base">
          Booked value vs commission earned over time
        </p>
      </div>
      <div className="mt-5 h-72 rounded-xl bg-linear-to-b from-blue-50 to-white p-3 sm:mt-6 sm:h-80">
        {isLoading ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Loading...
          </div>
        ) : !hasData ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            No revenue data for the selected period
          </div>
        ) : (
          <ResponsiveContainer height="100%" width="100%">
            <ComposedChart
              data={chartData}
              margin={{ bottom: 0, left: -10, right: 8, top: 16 }}
            >
              <CartesianGrid stroke="#dbeafe" strokeDasharray="4 4" vertical={false} />
              <XAxis
                axisLine={false}
                dataKey="period"
                tick={{ fill: '#64748b', fontSize: 11, fontWeight: 700 }}
                tickLine={false}
              />
              <YAxis
                axisLine={false}
                tick={{ fill: '#64748b', fontSize: 11, fontWeight: 700 }}
                tickFormatter={v => formatCompactVnd(v)}
                tickLine={false}
              />
              <Tooltip content={<ChartTooltip />} />
              <Legend />
              <Bar
                barSize={18}
                dataKey="gmv"
                fill="#2f7df6"
                name="GMV"
                radius={[8, 8, 0, 0]}
              />
              <Line
                dataKey="netPlatformRevenue"
                dot={{ r: 3 }}
                name="Net Platform Revenue"
                stroke="#047857"
                strokeWidth={2.5}
                type="monotone"
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
