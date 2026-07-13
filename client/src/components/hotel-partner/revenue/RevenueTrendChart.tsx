import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { formatCompactVnd, formatVndFull } from '@/utils/formatCurrency';
import type { HotelRevenueSeriesPoint } from '@/types/hotel-revenue.types';

interface RevenueTrendChartProps {
  series: HotelRevenueSeriesPoint[];
}

interface TrendTooltipProps {
  active?: boolean;
  label?: string | number;
  payload?: Array<{
    dataKey?: string | number;
    name?: string;
    value?: number;
    color?: string;
  }>;
}

/** Tooltip hiện Gross / Net / Commission với số VND đầy đủ + mốc thời gian. */
function ChartTooltip({ active, payload, label }: TrendTooltipProps) {
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
          <span className="text-slate-500">{entry.name}:</span>
          <span className="font-medium text-slate-800">{formatVndFull(entry.value ?? 0)}</span>
        </div>
      ))}
    </div>
  );
}

/** Cột Gross (tổng) + đường Net (thực nhận) + đường Commission theo từng kỳ. */
export function RevenueTrendChart({ series }: RevenueTrendChartProps) {
  const data = series.map(p => ({
    period: p.period,
    gross: Number(p.gross),
    net: Number(p.net),
    commission: Number(p.commission),
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <ComposedChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis
          dataKey="period"
          tick={{ fontSize: 12, fill: '#94a3b8' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: '#94a3b8' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={v => formatCompactVnd(v)}
        />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: '#f8fafc' }} />
        <Legend />
        <Bar dataKey="gross" name="Gross" fill="#0ea5e9" radius={[4, 4, 0, 0]} maxBarSize={40} />
        <Line
          type="monotone"
          dataKey="net"
          name="Net"
          stroke="#10b981"
          strokeWidth={2.5}
          dot={{ r: 3 }}
        />
        <Line
          type="monotone"
          dataKey="commission"
          name="Commission"
          stroke="#f59e0b"
          strokeWidth={2}
          strokeDasharray="5 4"
          dot={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
