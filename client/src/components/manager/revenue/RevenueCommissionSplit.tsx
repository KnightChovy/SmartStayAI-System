import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { formatVndFull } from '@/utils/formatCurrency';
import type { RevenueSummary } from '@/types/revenue.types';
import type { ChartTooltipProps } from './chart-tooltip';
import { ChartSkeleton, SectionEmpty, SectionError } from './states';

interface RevenueCommissionSplitProps {
  data: RevenueSummary | undefined;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}

const COLORS = ['#F59E0B', '#10B981']; // pending (chờ đối soát) / settled (đã chi trả)

function SplitTooltip({ active, payload }: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const datum = payload[0]?.payload as
    | { label: string; amount: number; share: number }
    | undefined;
  if (!datum) return null;
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-lg text-xs">
      <p className="font-semibold text-slate-800">{datum.label}</p>
      <p className="text-slate-600">{formatVndFull(datum.amount)}</p>
      <p className="text-slate-400">{datum.share}%</p>
    </div>
  );
}

/**
 * Hoa hồng đã ghi nhận tách theo trạng thái đối soát — thay cho donut "Revenue by Region"
 * cũ (BE không có endpoint gom doanh thu theo khu vực). Số lấy thẳng từ `summary` của
 * `GET /admin/revenue` nên KHÔNG tốn request thêm.
 */
export function RevenueCommissionSplit({
  data,
  isLoading,
  isError,
  onRetry,
}: RevenueCommissionSplitProps) {
  const pending = Number(data?.commissionPending ?? 0);
  const settled = Number(data?.commissionSettled ?? 0);
  const total = pending + settled;
  const share = (v: number) => (total > 0 ? Math.round((v / total) * 1000) / 10 : 0);

  const segments = [
    { label: 'Pending', amount: pending, share: share(pending) },
    { label: 'Settled', amount: settled, share: share(settled) },
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <h2 className="font-semibold text-slate-900">Commission Status</h2>
      <p className="text-xs text-slate-500 mt-0.5 mb-4">
        Recognised commission by settlement status
      </p>

      {isError ? (
        <SectionError onRetry={onRetry} />
      ) : isLoading || !data ? (
        <ChartSkeleton height="h-56" />
      ) : total === 0 ? (
        <SectionEmpty height="h-56" message="No commission recorded for the selected period" />
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
                dataKey="amount"
                nameKey="label"
                paddingAngle={3}
              >
                {segments.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<SplitTooltip />} />
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
                <span className="text-slate-500 text-xs font-medium shrink-0">
                  {formatVndFull(s.amount)} · {s.share}%
                </span>
              </div>
            ))}
            <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-xs">
              <span className="text-slate-500">Refunded to guests</span>
              <span className="font-medium text-slate-700">
                {formatVndFull(data.refunded)}
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
