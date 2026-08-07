import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Building2, Star } from 'lucide-react';
import { ManagerModal } from '@/components/manager/shared/ManagerModal';
import { useHotel } from '@/hooks/hotels';
import { useHotelRevenue } from '@/hooks/hotel-revenue';
import { cn } from '@/lib/cn';
import type { DateRange } from '@/types/revenue.types';
import { formatAddress } from '@/utils/formatAddress';
import { formatCompactVnd, formatVndFull } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/formatDate';
import { pickRevenueBucket } from '@/utils/revenueBucket';
import type { ChartTooltipProps } from './chart-tooltip';
import { ChartSkeleton, SectionEmpty, SectionError } from './states';

interface RevenueHotelDetailModalProps {
  /** `null` = đóng. Tên truyền sẵn từ dòng bảng để header hiện ngay, không chờ request. */
  hotel: { id: string; name: string } | null;
  /** PHẢI là đúng khoảng của bảng breakdown — lệch một ngày là hai bên ra số khác nhau
   *  một cách hợp lệ và trông như bug. */
  range: DateRange;
  onClose: () => void;
}

/**
 * Drill-down một khách sạn — không có endpoint mới, ghép 2 endpoint sẵn có:
 *   `GET /hotels/:id`          → tên, địa chỉ, hạng sao
 *   `GET /hotels/:id/revenue`  → doanh thu + % đang áp dụng + series cho chart
 *
 * Platform Manager gọi được vì `getOperableHotel` cho qua khi user có quyền `manageBookings`.
 */
export function RevenueHotelDetailModal({
  hotel,
  range,
  onClose,
}: RevenueHotelDetailModalProps) {
  const hotelId = hotel?.id ?? '';
  const detail = useHotel(hotelId);
  const bucket = pickRevenueBucket(range.from, range.to);
  const revenue = useHotelRevenue(hotelId, { ...range, groupBy: bucket });

  const summary = revenue.data?.summary;
  const series = revenue.data?.series ?? [];
  const chartData = series.map(p => ({
    period: p.period,
    gross: Number(p.gross),
    commission: Number(p.commission),
  }));
  const hasSeries = chartData.some(p => p.gross > 0 || p.commission > 0);

  return (
    <ManagerModal
      open={hotel !== null}
      onClose={onClose}
      title={hotel?.name ?? 'Hotel revenue'}
      description={`${formatDate(range.from)} → ${formatDate(range.to)} · same period as the breakdown table`}
      icon={Building2}
      size="lg"
    >
      <div className="space-y-5">
        {/* Nhận dạng khách sạn — để chắc chắn đang xem đúng cơ sở, không chỉ đúng cái tên. */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3">
          {detail.isLoading && !detail.data ? (
            <div className="h-8 animate-pulse rounded bg-slate-200/70" />
          ) : detail.data ? (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <p className="font-medium text-slate-900">{detail.data.name}</p>
              {detail.data.starRating != null && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-600">
                  <Star className="h-3 w-3 fill-current" />
                  {detail.data.starRating}
                </span>
              )}
              <p className="w-full text-xs text-slate-500">
                {formatAddress(
                  detail.data.address,
                  detail.data.city,
                  detail.data.country
                )}
              </p>
            </div>
          ) : (
            <p className="text-xs text-slate-400">
              Could not load the hotel profile — the revenue figures below are
              unaffected.
            </p>
          )}
        </div>

        {revenue.isError ? (
          <SectionError onRetry={() => revenue.refetch()} />
        ) : revenue.isLoading && !summary ? (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-20 animate-pulse rounded-xl border border-slate-200 bg-slate-50"
                />
              ))}
            </div>
            <ChartSkeleton height="h-48" />
          </>
        ) : !summary ? (
          <SectionEmpty message="No revenue recorded for this hotel in the selected period" />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Metric label="Gross Revenue" value={summary.gross} />
              <Metric label="Platform commission" value={summary.commission} />
              <Metric label="Revenue after commission" value={summary.net} />
              <Metric label="Refunded" value={summary.refunded} tone="danger" />
              <Metric
                label="Revenue after refunds"
                value={summary.netAfterRefund}
                tone="accent"
              />
              <div className="rounded-xl border border-slate-200 p-3">
                <p className="text-lg font-bold text-slate-900 tabular-nums">
                  {summary.bookingCount.toLocaleString('vi-VN')}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">Bookings</p>
              </div>
            </div>

            {/* §6 — hai loại "%" khác nhau. Nhãn phải nói rõ, không thì lệch với cột
                "Comm. rate" của bảng sẽ bị hiểu là bug thay vì là đổi mức hoa hồng. */}
            <div className="rounded-xl border border-slate-200 px-4 py-3">
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-sm text-slate-600">
                  Commission rate{' '}
                  <span className="text-slate-400">currently applied</span>
                </p>
                <p className="font-semibold text-slate-900 tabular-nums">
                  {formatRate(summary.commissionRate)}
                </p>
              </div>
              <p className="mt-1 text-xs text-slate-400">
                The breakdown table shows the average rate charged across this
                period, so the two differ whenever the hotel's rate was changed
                recently.
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Gross vs commission · by {bucket}
              </p>
              {!hasSeries ? (
                <SectionEmpty
                  height="h-40"
                  message="No revenue in this period to chart"
                />
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <ComposedChart
                    data={chartData}
                    margin={{ top: 5, right: 8, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis
                      dataKey="period"
                      tick={{ fontSize: 11, fill: '#94a3b8' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    {/* MỘT trục cho cả hai series: hoa hồng chỉ ~15% doanh thu, cho nó trục
                        riêng sẽ vẽ cao ngang doanh thu và đọc sai tỷ lệ. */}
                    <YAxis
                      width={56}
                      tick={{ fontSize: 11, fill: '#94a3b8' }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={v => formatCompactVnd(v)}
                    />
                    <Tooltip content={<HotelChartTooltip />} />
                    <Bar
                      dataKey="gross"
                      fill="#93C5FD"
                      name="Gross"
                      radius={[4, 4, 0, 0]}
                    />
                    <Line
                      type="monotone"
                      dataKey="commission"
                      stroke="#10b981"
                      strokeWidth={2.5}
                      dot={{ r: 3 }}
                      name="Commission"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              )}
            </div>
          </>
        )}
      </div>
    </ManagerModal>
  );
}

function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: 'danger' | 'accent';
}) {
  const amount = Number(value);
  return (
    <div
      className={cn(
        'rounded-xl border p-3',
        tone === 'accent'
          ? 'border-emerald-200 bg-emerald-50/50'
          : 'border-slate-200'
      )}
    >
      <p
        className={cn(
          'truncate text-lg font-bold tabular-nums',
          tone === 'danger' && amount > 0
            ? 'text-red-600'
            : tone === 'accent'
              ? 'text-emerald-700'
              : 'text-slate-900'
        )}
        title={formatVndFull(value)}
      >
        {formatCompactVnd(value)}
      </p>
      <p className="mt-0.5 text-xs text-slate-500">{label}</p>
    </div>
  );
}

function HotelChartTooltip({ active, payload, label }: ChartTooltipProps) {
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
          <span className="font-medium text-slate-800">
            {formatVndFull(entry.value ?? 0)}
          </span>
        </div>
      ))}
    </div>
  );
}

/** `"12"` → `12%`, `"12.50"` → `12.5%`. */
function formatRate(value: string): string {
  const n = Number(value);
  if (!Number.isFinite(n)) return '—';
  return `${n.toFixed(2).replace(/\.?0+$/, '')}%`;
}
