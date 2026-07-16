import {
  Area,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  ComposedChart,
} from 'recharts';
import type { PartnerRevenuePoint } from '@/hooks/partner-dashboard';
import { formatCompactVnd, formatVndFull } from '@/utils/formatCurrency';

interface RevenueBookingChartProps {
  data: PartnerRevenuePoint[];
  isLoading?: boolean;
}

interface ChartTooltipProps {
  active?: boolean;
  label?: string | number;
  payload?: Array<{
    dataKey?: string | number;
    value?: number;
    color?: string;
  }>;
}

/** Tooltip: Revenue (VND đầy đủ) + số Bookings. */
function ChartTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg">
      <p className="mb-1 font-semibold text-slate-800">{label}</p>
      {payload.map(entry => (
        <div key={entry.dataKey} className="flex items-center gap-2">
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ background: entry.color }}
          />
          <span className="text-slate-500">
            {entry.dataKey === 'revenue' ? 'Revenue:' : 'Bookings:'}
          </span>
          <span className="font-medium text-slate-800">
            {entry.dataKey === 'revenue'
              ? formatVndFull(entry.value ?? 0)
              : (entry.value ?? 0)}
          </span>
        </div>
      ))}
    </div>
  );
}

function shortDay(period: string): string {
  const parts = period.split('-');
  return parts.length === 3 ? `${parts[2]}/${parts[1]}` : period;
}

export function RevenueBookingChart({
  data,
  isLoading,
}: RevenueBookingChartProps) {
  const chartData = data.map(p => ({
    name: shortDay(p.period),
    revenue: p.gross,
    bookings: p.bookings,
  }));

  return (
    <div className="p-6 rounded-xl border border-slate-200 bg-white shadow-sm mb-6 flex-1 min-h-87.5 transition-transform duration-300 hover:scale-103">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h3 className="text-base font-bold text-slate-900">
            Revenue & Booking Trends
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Daily performance this month
          </p>
        </div>
      </div>

      <div className="h-55 w-full">
        {isLoading ? (
          <div className="h-full w-full bg-slate-50 rounded-lg animate-pulse" />
        ) : chartData.length === 0 ? (
          <div className="h-full w-full flex items-center justify-center text-sm text-slate-400">
            No revenue data for this period yet.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={chartData}
              margin={{ top: 10, right: 0, left: -20, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={true}
                stroke="#f1f5f9"
              />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: '#64748b', fontWeight: 500 }}
                dy={15}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: '#64748b', fontWeight: 500 }}
                tickFormatter={value =>
                  formatCompactVnd(value).replace(' VNĐ', '')
                }
                dx={-5}
              />
              <RechartsTooltip
                content={<ChartTooltip />}
                cursor={{ fill: '#f8fafc' }}
              />
              <Bar
                dataKey="bookings"
                fill="#94a3b8"
                radius={[2, 2, 0, 0]}
                barSize={18}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#2563eb"
                fill="url(#colorRevenue)"
                strokeWidth={2.5}
              />
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                </linearGradient>
              </defs>
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="flex justify-center items-center gap-6 mt-6">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-role-partner-primary"></div>
          <span className="text-xs font-semibold text-slate-700">Revenue</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-slate-400"></div>
          <span className="text-xs font-semibold text-slate-700">Bookings</span>
        </div>
      </div>
    </div>
  );
}
