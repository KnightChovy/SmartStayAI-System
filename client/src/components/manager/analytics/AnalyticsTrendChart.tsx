import { LineChart as LineChartIcon } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { PlatformAnalytics } from '@/types/analytics.types';
import { MIN_TREND_POINTS, formatNumber, type ChartTooltipProps } from './helpers';

interface AnalyticsTrendChartProps {
  timeSeries: PlatformAnalytics['timeSeries'];
}

export function AnalyticsTrendChart({ timeSeries }: AnalyticsTrendChartProps) {
  // A2: đủ điểm khác 0 mới vẽ xu hướng
  const nonZeroPoints = timeSeries.filter(
    p => p.bookings > 0 || p.confirmedBookings > 0 || p.newUsers > 0
  ).length;
  const canShowTrend = nonZeroPoints >= MIN_TREND_POINTS;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <h2 className="font-semibold text-slate-900 mb-6">Bookings & New Users Over Time</h2>
      {!canShowTrend ? (
        <LowDataBlock />
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={timeSeries} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="period" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip content={<LineTooltip />} />
            <Legend />
            <Line type="monotone" dataKey="bookings" stroke="#2563EB" strokeWidth={2.5} dot={{ r: 3 }} name="Bookings" />
            <Line type="monotone" dataKey="confirmedBookings" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3 }} name="Confirmed" />
            <Line type="monotone" dataKey="newUsers" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3 }} name="New Users" strokeDasharray="5 4" />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

/** A4: tooltip hiện đủ 3 series + mốc thời gian. */
function LineTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-lg text-xs">
      <p className="font-semibold text-slate-800 mb-1">{label}</p>
      {payload.map(entry => (
        <div key={entry.dataKey} className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full" style={{ background: entry.color }} />
          <span className="text-slate-500">{entry.name}:</span>
          <span className="font-medium text-slate-800">{formatNumber(Number(entry.value ?? 0))}</span>
        </div>
      ))}
    </div>
  );
}

/** A2: dữ liệu quá thưa để vẽ xu hướng. */
function LowDataBlock() {
  return (
    <div className="flex flex-col items-center justify-center h-64 text-center text-slate-400">
      <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-slate-100">
        <LineChartIcon className="w-6 h-6" />
      </div>
      <p className="text-sm font-medium text-slate-500">Not enough data to show a trend yet</p>
      <p className="text-xs mt-1 max-w-xs">
        Trends appear once there are at least {MIN_TREND_POINTS} periods with activity.
      </p>
    </div>
  );
}
