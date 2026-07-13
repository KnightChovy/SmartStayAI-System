import { useState } from 'react';
import {
  Gauge,
  BedDouble,
  XCircle,
  Star,
  Timer,
  CalendarCheck,
  MessageSquare,
} from 'lucide-react';
import { useHotelAnalytics } from '@/hooks/hotel-revenue';
import { DatePicker } from '@/components/ui/date-picker';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/hotel-partner/shared/states';
import { cn } from '@/lib/cn';
import { formatDate } from '@/utils/formatDate';
import type { HotelPerformanceScores } from '@/types/platform-manager.types';

interface AnalyticsTabProps {
  hotelId: string;
}

/** 0..1 → "72%"; null → "—". */
function fmtRate(v: number | null): string {
  return v === null || v === undefined ? '—' : `${Math.round(v * 100)}%`;
}
/** Số sao 0..5 → "4.3 / 5". */
function fmtRating(v: number | null): string {
  return v === null || v === undefined ? '—' : `${v.toFixed(1)} / 5`;
}
/** Phút → "45 min". */
function fmtResponse(v: number | null): string {
  return v === null || v === undefined ? '—' : `${Math.round(v)} min`;
}
/** Màu theo điểm 0..100. */
function scoreTone(score: number | null): string {
  if (score === null || score === undefined) return 'text-slate-400';
  if (score >= 80) return 'text-emerald-600';
  if (score >= 60) return 'text-amber-600';
  return 'text-red-500';
}
function scoreBar(score: number | null): string {
  if (score === null || score === undefined) return 'bg-slate-300';
  if (score >= 80) return 'bg-emerald-500';
  if (score >= 60) return 'bg-amber-500';
  return 'bg-red-500';
}

const SCORE_ROWS: { key: keyof HotelPerformanceScores; label: string; weight: string }[] = [
  { key: 'rating', label: 'Guest rating', weight: '40%' },
  { key: 'occupancy', label: 'Occupancy', weight: '25%' },
  { key: 'cancellation', label: 'Cancellation', weight: '20%' },
  { key: 'response', label: 'Response time', weight: '15%' },
];

/**
 * Nội dung tab Analytics của MỘT khách sạn: điểm hiệu suất tổng hợp + 4 điểm
 * thành phần + các chỉ số thô. Nối `GET /hotels/:id/analytics`.
 */
export function AnalyticsTab({ hotelId }: AnalyticsTabProps) {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const { data, isLoading, isError } = useHotelAnalytics(hotelId, { from, to });

  if (isError) return <ErrorState label="Failed to load analytics." />;
  if (isLoading || !data) return <AnalyticsSkeleton />;

  const { metrics, scores, score, window } = data;

  return (
    <div className="space-y-6">
      {/* ─── Bộ lọc + window ─── */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-40">
            <label className="mb-1 block text-xs font-medium text-slate-500">From</label>
            <DatePicker value={from} onChange={setFrom} max={to || undefined} placeholder="90 days ago" />
          </div>
          <div className="w-40">
            <label className="mb-1 block text-xs font-medium text-slate-500">To</label>
            <DatePicker value={to} onChange={setTo} min={from || undefined} placeholder="Today" />
          </div>
        </div>
        <p className="text-xs text-slate-400">
          Window: {formatDate(window.from)} – {formatDate(window.to)}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* ─── Điểm tổng hợp ─── */}
        <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-8">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-role-partner-light">
            <Gauge className="h-6 w-6 text-role-partner-primary" />
          </div>
          <p className="text-sm font-medium text-slate-500">Overall performance score</p>
          <p className={cn('mt-1 text-5xl font-bold tracking-tight', scoreTone(score))}>
            {score ?? '—'}
            {score !== null && <span className="text-xl text-slate-400"> /100</span>}
          </p>
        </div>

        {/* ─── Điểm thành phần ─── */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 lg:col-span-2">
          <h2 className="mb-4 font-semibold text-slate-900">Score breakdown</h2>
          <div className="space-y-4">
            {SCORE_ROWS.map(row => {
              const val = scores[row.key];
              return (
                <div key={row.key}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="text-slate-600">
                      {row.label}
                      <span className="ml-1.5 text-xs text-slate-400">({row.weight})</span>
                    </span>
                    <span className={cn('font-semibold tabular-nums', scoreTone(val))}>
                      {val ?? '—'}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={cn('h-full rounded-full transition-all', scoreBar(val))}
                      style={{ width: `${val ?? 0}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ─── Metric cards ─── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard icon={BedDouble} label="Occupancy rate" value={fmtRate(metrics.occupancyRate)} tone="text-sky-600" />
        <MetricCard icon={XCircle} label="Cancellation rate" value={fmtRate(metrics.cancellationRate)} tone="text-red-500" />
        <MetricCard icon={Star} label="Average rating" value={fmtRating(metrics.avgRating)} tone="text-amber-500" />
        <MetricCard icon={Timer} label="Avg. response" value={fmtResponse(metrics.avgResponseMinutes)} tone="text-violet-600" />
      </div>

      {/* ─── Chỉ số thô ─── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <RawStat icon={CalendarCheck} label="Total bookings" value={metrics.totalBookings} />
        <RawStat icon={XCircle} label="Cancelled bookings" value={metrics.cancelledBookings} />
        <RawStat icon={MessageSquare} label="Reviews" value={metrics.reviewCount} />
      </div>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

interface MetricCardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  tone: string;
}

function MetricCard({ icon: Icon, label, value, tone }: MetricCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="mb-2 flex items-center gap-2">
        <Icon className={cn('h-4 w-4', tone)} />
        <span className="text-xs font-medium text-slate-500">{label}</span>
      </div>
      <p className="text-2xl font-bold tracking-tight text-slate-900">{value}</p>
    </div>
  );
}

function RawStat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white">
        <Icon className="h-5 w-5 text-slate-500" />
      </div>
      <div>
        <p className="text-xs font-medium text-slate-500">{label}</p>
        <p className="text-xl font-bold tracking-tight text-slate-900">{value}</p>
      </div>
    </div>
  );
}

function AnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-48 rounded-xl lg:col-span-2" />
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
