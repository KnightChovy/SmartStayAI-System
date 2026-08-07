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
import { GitCompareArrows } from 'lucide-react';
import { cn } from '@/lib/cn';
import { formatCompactVnd, formatVndFull } from '@/utils/formatCurrency';
import type { RevenueBucket, RevenueTimeSeries } from '@/types/revenue.types';
import type { ChartTooltipProps } from './chart-tooltip';
import { ChartSkeleton, SectionEmpty, SectionError } from './states';

interface RevenueVsCommissionChartProps {
  data: RevenueTimeSeries | undefined;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  compare: boolean;
  onToggleCompare: () => void;
}

/** Xám = phần trả khách sạn, xanh = phần sàn giữ. Chiều cao cả cột = GMV. */
const COLOR_COMMISSION = '#10b981';
const COLOR_REST = '#cbd5e1';
const COLOR_PREVIOUS = '#93c5fd';

interface ChartPoint {
  period: string;
  gmv: number;
  commission: number;
  /** Phần còn lại về khách sạn — chỉ để dựng cột chồng, tổng hai đoạn = GMV. */
  rest: number;
  previousRevenue?: number;
  inProgress: boolean;
}

export function RevenueVsCommissionChart({
  data,
  isLoading,
  isError,
  onRetry,
  compare,
  onToggleCompare,
}: RevenueVsCommissionChartProps) {
  const bucket = data?.bucket ?? 'day';
  const points = buildPoints(data);
  const hasData = points.some(p => p.gmv > 0 || p.commission > 0);
  const droppedFuture = (data?.points.length ?? 0) - points.length;
  const hasInProgress = points.some(p => p.inProgress);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <div className="mb-1 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold text-slate-900">
            Where the booking money went
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Each bar is one {bucket === 'day' ? 'day' : 'month'} of bookings —
            the green part is what the platform kept
          </p>
        </div>
        <button
          type="button"
          onClick={onToggleCompare}
          className={cn(
            'flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors',
            compare
              ? 'bg-role-manager-light text-role-manager-primary'
              : 'text-slate-500 hover:bg-slate-100'
          )}
        >
          <GitCompareArrows className="h-3.5 w-3.5" />
          Compare previous
        </button>
      </div>

      {isError ? (
        <SectionError onRetry={onRetry} />
      ) : isLoading || !data ? (
        <ChartSkeleton />
      ) : !hasData ? (
        <SectionEmpty />
      ) : (
        <>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart
              data={points}
              margin={{ top: 16, right: 8, left: 0, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#f1f5f9"
                vertical={false}
              />
              <XAxis
                dataKey="period"
                tickFormatter={p => formatPeriodLabel(p, bucket)}
                tick={{ fontSize: 12, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
              />

              <YAxis
                width={58}
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
                // Bỏ đuôi " VNĐ" ở tick: chuỗi dài làm nhãn vỡ hai dòng ("60M / VNĐ").
                tickFormatter={v => compactNoUnit(v)}
              />
              <Tooltip
                content={<ChartTooltip bucket={bucket} />}
                cursor={{ fill: '#f8fafc' }}
              />
              <Legend
                iconType="circle"
                wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
              />
              <Bar
                dataKey="commission"
                stackId="gmv"
                fill={COLOR_COMMISSION}
                name="Platform commission"
                radius={[0, 0, 0, 0]}
                maxBarSize={64}
              />
              <Bar
                dataKey="rest"
                stackId="gmv"
                fill={COLOR_REST}
                name="Paid out to hotels"
                radius={[4, 4, 0, 0]}
                maxBarSize={64}
              />
              {compare && (
                <Line
                  type="monotone"
                  dataKey="previousRevenue"
                  stroke={COLOR_PREVIOUS}
                  strokeWidth={2}
                  strokeDasharray="5 4"
                  dot={false}
                  name="Total previous period"
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>

          {/* Kỳ chưa kết thúc / kỳ chưa xảy ra là hai nguồn hiểu nhầm khác nhau — nói rõ cả hai.
              Không nói thì cột cuối thấp bị đọc là "doanh thu tụt". */}
          {(hasInProgress || droppedFuture > 0) && (
            <p className="mt-2 text-xs text-slate-400">
              {hasInProgress && 'The last bar is a period still in progress. '}
              {droppedFuture > 0 && 'Nothing is charted past today.'}
            </p>
          )}
        </>
      )}
    </div>
  );
}

// ─── Tooltip ─────────────────────────────────────────────────────────────────

function ChartTooltip({
  active,
  payload,
  bucket,
}: ChartTooltipProps & { bucket?: RevenueBucket }) {
  if (!active || !payload || payload.length === 0) return null;
  const datum = payload[0]?.payload as ChartPoint | undefined;
  if (!datum) return null;

  const takeRate = datum.gmv > 0 ? (datum.commission / datum.gmv) * 100 : null;

  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg">
      <p className="mb-1.5 font-semibold text-slate-800">
        {formatPeriodLabel(datum.period, bucket ?? 'day')}
        {datum.inProgress && (
          <span className="ml-1 font-normal text-slate-400">· in progress</span>
        )}
      </p>
      <Line2
        color={COLOR_COMMISSION}
        label="Platform commission"
        value={datum.commission}
      />
      <Line2 color={COLOR_REST} label="Paid out to hotels" value={datum.rest} />
      <div className="mt-1.5 flex items-center justify-between gap-4 border-t border-slate-100 pt-1.5">
        <span className="text-slate-500">Total bookings</span>
        <span className="font-semibold text-slate-900">
          {formatVndFull(datum.gmv)}
        </span>
      </div>
      {takeRate !== null && (
        <p className="mt-0.5 text-slate-400">
          Platform kept {takeRate.toFixed(1)}%
        </p>
      )}
      {datum.previousRevenue !== undefined && (
        <p className="mt-1 border-t border-slate-100 pt-1 text-slate-500">
          Previous period: {formatVndFull(datum.previousRevenue)}
        </p>
      )}
    </div>
  );
}

function Line2({
  color,
  label,
  value,
}: {
  color: string;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="flex items-center gap-1.5 text-slate-500">
        <span
          className="inline-block h-2 w-2 rounded-full"
          style={{ background: color }}
        />
        {label}
      </span>
      <span className="font-medium text-slate-800">{formatVndFull(value)}</span>
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Bỏ các kỳ **hoàn toàn nằm ở tương lai** và đánh dấu kỳ **đang chạy dở**.
 *
 * Vì sao bắt buộc: preset "This quarter" cho range tới 30/09 trong khi hôm nay mới 07/08,
 * nên BE trả các bucket rỗng của tháng 9. Vẽ chúng thành 0 khiến biểu đồ đổ dốc thẳng
 * xuống đáy và đọc như "doanh thu sụp", trong khi thực tế là "chưa tới ngày".
 */
function buildPoints(data: RevenueTimeSeries | undefined): ChartPoint[] {
  if (!data) return [];
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const todayKey = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const currentKey = data.bucket === 'month' ? todayKey.slice(0, 7) : todayKey;

  return (
    data.points
      // Khoá kỳ là YYYY-MM hoặc YYYY-MM-DD ⇒ so chuỗi là so đúng thứ tự thời gian.
      .filter(p => p.period <= currentKey)
      .map(p => {
        const gmv = Number(p.revenue);
        const commission = Number(p.commission);
        return {
          period: p.period,
          gmv,
          commission,
          // Kẹp ≥ 0: hoa hồng lớn hơn GMV là bất thường, nhưng để đoạn âm thì recharts đẩy
          // xuống dưới trục và đỉnh cột không còn bằng GMV nữa.
          rest: Math.max(0, gmv - commission),
          previousRevenue:
            p.previousRevenue !== undefined
              ? Number(p.previousRevenue)
              : undefined,
          inProgress: p.period === currentKey,
        };
      })
  );
}

/** `2026-08` → `Th8 2026`; `2026-08-07` → `07/08`. Nhãn ngắn cho trục X. */
function formatPeriodLabel(period: string, bucket: RevenueBucket): string {
  const parts = period.split('-');
  if (bucket === 'month' && parts.length >= 2) return `${parts[1]}/${parts[0]}`;
  if (parts.length === 3) return `${parts[2]}/${parts[1]}`;
  return period;
}

/** Rút gọn KHÔNG kèm đơn vị — đơn vị đã nói ở tooltip và ở khối KPI. */
function compactNoUnit(value: number): string {
  return formatCompactVnd(value).replace(' VNĐ', '');
}
