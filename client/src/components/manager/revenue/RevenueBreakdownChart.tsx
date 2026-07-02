import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { formatVndFull } from '@/utils/formatCurrency';
import type { RevenueBreakdown } from '@/types/revenue.types';
import type { ChartTooltipProps } from './chart-tooltip';
import { ChartSkeleton, SectionEmpty, SectionError } from './states';

interface RevenueBreakdownChartProps {
  data: RevenueBreakdown | undefined;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}

const COLORS = ['#2563EB', '#3B82F6', '#60A5FA', '#93C5FD', '#BFDBFE', '#1E40AF', '#38BDF8'];

function BreakdownTooltip({ active, payload }: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const datum = payload[0]?.payload as { label: string; revenue: number; share: number } | undefined;
  if (!datum) return null;
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-lg text-xs">
      <p className="font-semibold text-slate-800">{datum.label}</p>
      <p className="text-slate-600">{formatVndFull(datum.revenue)}</p>
      <p className="text-slate-400">{datum.share}%</p>
    </div>
  );
}

export function RevenueBreakdownChart({
  data,
  isLoading,
  isError,
  onRetry,
}: RevenueBreakdownChartProps) {
  const segments = (data?.segments ?? []).map(s => ({
    label: s.label,
    revenue: Number(s.revenue),
    share: s.share,
  }));
  const hasData = segments.length > 0;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <h2 className="font-semibold text-slate-900 mb-4">Revenue by Region</h2>
      {isError ? (
        <SectionError onRetry={onRetry} />
      ) : isLoading || !data ? (
        <ChartSkeleton height="h-56" />
      ) : !hasData ? (
        <SectionEmpty height="h-56" />
      ) : (
        <>
          <ResponsiveContainer width="100%" height={170}>
            <PieChart>
              <Pie
                data={segments}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={70}
                dataKey="revenue"
                nameKey="label"
                paddingAngle={3}
              >
                {segments.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<BreakdownTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-3">
            {segments.map((s, i) => (
              <div key={s.label} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ background: COLORS[i % COLORS.length] }}
                  />
                  <span className="text-slate-700 text-xs truncate">{s.label}</span>
                </div>
                <span className="text-slate-500 text-xs font-medium shrink-0">{s.share}%</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
