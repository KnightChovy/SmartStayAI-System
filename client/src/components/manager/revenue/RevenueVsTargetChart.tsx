import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { formatCompactVnd, formatVndFull } from '@/utils/formatCurrency';
import type { RevenueTimeSeries } from '@/types/revenue.types';
import type { ChartTooltipProps } from './chart-tooltip';
import { ChartSkeleton, SectionEmpty, SectionError } from './states';

interface RevenueVsTargetChartProps {
  data: RevenueTimeSeries | undefined;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}

const MET = '#2563EB'; // đạt target
const MISS = '#F59E0B'; // chưa đạt

/** Tooltip: Revenue, Target và % đạt target — AC-6.1. */
function TargetTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const datum = payload[0]?.payload as { revenue: number; target: number | null } | undefined;
  if (!datum) return null;
  const attainment =
    datum.target && datum.target > 0 ? Math.round((datum.revenue / datum.target) * 100) : null;
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-lg text-xs">
      <p className="font-semibold text-slate-800 mb-1">{label}</p>
      <div className="flex items-center gap-2">
        <span className="text-slate-500">Revenue:</span>
        <span className="font-medium text-slate-800">{formatVndFull(datum.revenue)}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-slate-500">Target:</span>
        <span className="font-medium text-slate-800">
          {datum.target === null ? '—' : formatVndFull(datum.target)}
        </span>
      </div>
      {attainment !== null && (
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-slate-500">Attainment:</span>
          <span className={attainment >= 100 ? 'font-semibold text-emerald-600' : 'font-semibold text-amber-600'}>
            {attainment}%
          </span>
        </div>
      )}
    </div>
  );
}

export function RevenueVsTargetChart({
  data,
  isLoading,
  isError,
  onRetry,
}: RevenueVsTargetChartProps) {
  // BE có thể trả target=null (chưa cấu hình mục tiêu) → ẩn chart theo spec.
  const hasTarget = !!data && data.points.some(p => p.target !== null);
  const hasData = !!data && data.points.some(p => Number(p.revenue) > 0);

  const chartData = (data?.points ?? []).map(p => ({
    period: p.period,
    revenue: Number(p.revenue),
    target: p.target === null ? null : Number(p.target),
  }));

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-semibold text-slate-900">Revenue vs Target</h2>
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ background: MET }} /> Target met
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ background: MISS }} /> Below target
          </span>
        </div>
      </div>

      {isError ? (
        <SectionError onRetry={onRetry} />
      ) : isLoading || !data ? (
        <ChartSkeleton height="h-56" />
      ) : !hasData || !hasTarget ? (
        <SectionEmpty
          height="h-56"
          message={
            !hasTarget
              ? 'No revenue target has been set for this period'
              : undefined
          }
        />
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="period" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <YAxis
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={v => formatCompactVnd(v)}
            />
            <Tooltip content={<TargetTooltip />} cursor={{ fill: '#f8fafc' }} />
            <Legend />
            <Bar dataKey="target" fill="#DBEAFE" radius={[4, 4, 0, 0]} name="Target" />
            <Bar dataKey="revenue" radius={[4, 4, 0, 0]} name="Revenue">
              {chartData.map((d, i) => (
                <Cell key={i} fill={d.target !== null && d.revenue >= d.target ? MET : MISS} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
