import { useState } from 'react';

import { Banknote, TrendingUp, Percent, RotateCcw, Wallet } from 'lucide-react';
import { useHotelRevenue } from '@/hooks/hotel-revenue';

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/hotel-partner/shared/states';
import { DateRangePresetPicker } from '@/components/shared/DateRangePresetPicker';
import {
  resolvePreset,
  type DateRangeValue,
  type RangePreset,
} from '@/components/shared/date-range-presets';
import { formatRate } from '@/components/shared/commission-labels';

import { cn } from '@/lib/cn';
import { formatCompactVnd, formatVndFull } from '@/utils/formatCurrency';
import type {
  HotelRevenueGroupBy,
  HotelRevenueSummary,
} from '@/types/hotel-revenue.types';
import { RevenueTrendChart } from './RevenueTrendChart';

const PARTNER_PRESETS: RangePreset[] = [
  'today',
  'last7',
  'last30',
  'thisMonth',
  'lastMonth',
  'custom',
];

interface RevenueTabProps {
  hotelId: string;
}

export function RevenueTab({ hotelId }: RevenueTabProps) {
  const [range, setRange] = useState<DateRangeValue>(() =>
    resolvePreset('last30')
  );
  const [preset, setPreset] = useState<RangePreset>('last30');
  const [groupBy, setGroupBy] = useState<HotelRevenueGroupBy>('day');

  const revenueQuery = useHotelRevenue(hotelId, { ...range, groupBy });

  const summary = revenueQuery.data?.summary;
  const series = revenueQuery.data?.series ?? [];

  const hasSeries = series.some(
    p => Number(p.gross) > 0 || Number(p.net) > 0 || Number(p.refunded) > 0
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-500">Period</span>
          <DateRangePresetPicker
            value={range}
            preset={preset}
            presets={PARTNER_PRESETS}
            tone="partner"
            onChange={(next, nextPreset) => {
              setRange(next);
              setPreset(nextPreset);
            }}
          />
        </div>

        <div className="flex items-center gap-1 rounded-lg border border-slate-200 p-1">
          {(['day', 'month'] as const).map(g => (
            <button
              key={g}
              type="button"
              onClick={() => setGroupBy(g)}
              aria-pressed={groupBy === g}
              className={cn(
                'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                groupBy === g
                  ? 'bg-role-partner-primary text-white'
                  : 'text-slate-500 hover:bg-slate-100'
              )}
            >
              {g === 'day' ? 'Daily' : 'Monthly'}
            </button>
          ))}
        </div>
      </div>

      {/* ─── KPI + Chart ─── */}
      {revenueQuery.isError ? (
        <ErrorState label="Failed to load revenue." />
      ) : revenueQuery.isLoading || !summary ? (
        <RevenueSkeleton />
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-12">
            <FinalRevenueCard summary={summary} />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-7">
              <StatTile
                icon={Banknote}
                label="Gross revenue"
                value={formatCompactVnd(summary.gross)}
                full={formatVndFull(summary.gross)}
                iconColor="text-sky-600"
              />
              <StatTile
                icon={Percent}
                label="Platform commission"
                value={formatCompactVnd(summary.commission)}
                full={formatVndFull(summary.commission)}
                iconColor="text-amber-600"
                sub={`${formatRate(summary.commissionRate)} rate`}
              />
              <StatTile
                icon={TrendingUp}
                label="Revenue after commission"
                value={formatCompactVnd(summary.net)}
                full={formatVndFull(summary.net)}
                iconColor="text-emerald-600"
              />
              <StatTile
                icon={RotateCcw}
                label="Refunded"
                value={formatCompactVnd(summary.refunded)}
                full={formatVndFull(summary.refunded)}
                iconColor="text-red-600"
                sub={
                  Number(summary.refunded) > 0
                    ? 'Deducted from your revenue'
                    : 'No refunds this period'
                }
              />
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-semibold text-slate-900">Revenue trend</h2>
              <span className="text-xs text-slate-400">
                {groupBy === 'day' ? 'Grouped by day' : 'Grouped by month'} ·{' '}
                {range.from} → {range.to}
              </span>
            </div>
            {hasSeries ? (
              <RevenueTrendChart series={series} groupBy={groupBy} />
            ) : (
              <p className="py-16 text-center text-sm text-slate-400">
                No revenue in this period yet.
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function FinalRevenueCard({ summary }: { summary: HotelRevenueSummary }) {
  const refunded = Number(summary.refunded);

  return (
    <div className="rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-white p-6 lg:col-span-5">
      <div>
        <div className="flex items-center gap-2.5">
          <span className="rounded-lg bg-emerald-600 p-2">
            <Wallet className="h-5 w-5 text-white" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
              Final revenue
            </p>
            <p className="text-[11px] text-slate-500">
              What this hotel actually keeps
            </p>
          </div>
        </div>

        <p className="mt-5 text-3xl font-bold tracking-tight tabular-nums text-emerald-700 sm:text-4xl">
          {formatVndFull(summary.netAfterRefund)}
        </p>

        <p className="mt-3 border-t border-emerald-100 pt-3 text-xs text-slate-500">
          After {formatRate(summary.commissionRate)} platform commission
          {refunded > 0
            ? ` and ${formatCompactVnd(summary.refunded)} refunded`
            : ' · no refunds this period'}{' '}
          · {summary.bookingCount.toLocaleString('vi-VN')} booking
          {summary.bookingCount === 1 ? '' : 's'}
        </p>
      </div>
    </div>
  );
}

interface StatTileProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  /** Số đã rút gọn (vd `876K VNĐ`) — tile hẹp nên không dùng số đầy đủ. */
  value: string;
  /** Số VND đầy đủ hiện khi hover. */
  full: string;
  iconColor: string;
  /** Dòng chú thích xám dưới số, vd `12% rate`. */
  sub?: string;
}

function StatTile({
  icon: Icon,
  label,
  value,
  full,
  iconColor,
  sub,
}: StatTileProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-2">
        <Icon className={cn('h-4 w-4 shrink-0', iconColor)} />
        <span className="text-xs font-medium text-slate-500">{label}</span>
      </div>
      <Tooltip>
        <TooltipTrigger asChild>
          <p className="mt-2 w-fit cursor-default text-xl font-bold tabular-nums text-slate-900">
            {value}
          </p>
        </TooltipTrigger>
        <TooltipContent>{full}</TooltipContent>
      </Tooltip>
      {sub && <p className="mt-0.5 text-[11px] text-slate-400">{sub}</p>}
    </div>
  );
}

function RevenueSkeleton() {
  return (
    <div className="space-y-6">
      {/* Khớp đúng hình dạng thật (hero + 2×2 tile) để không nhảy layout khi data về. */}
      <div className="grid gap-4 lg:grid-cols-12">
        <Skeleton className="h-44 rounded-xl lg:col-span-5" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-7">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      </div>
      <Skeleton className="h-80 rounded-xl" />
    </div>
  );
}
