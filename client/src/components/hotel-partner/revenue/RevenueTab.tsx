import { useState } from 'react';
import { Link } from 'react-router';
import {
  ArrowRight,
  Banknote,
  TrendingUp,
  Percent,
  RotateCcw,
  Receipt,
  Wallet,
  Clock,
} from 'lucide-react';
import { useHotelRevenue, useHotelWallet } from '@/hooks/hotel-revenue';
import { Button } from '@/components/ui/button';
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
import { ROUTES } from '@/constants/routes';
import { cn } from '@/lib/cn';
import {
  formatCompactVnd,
  formatCurrency,
  formatVndFull,
} from '@/utils/formatCurrency';
import type { HotelRevenueGroupBy } from '@/types/hotel-revenue.types';
import { RevenueTrendChart } from './RevenueTrendChart';

/**
 * Preset của cổng partner khác cổng manager: khách sạn đọc doanh thu theo ngày là chính,
 * nên ưu tiên các kỳ ngắn (7/30 ngày) thay vì quý/năm.
 */
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

/**
 * Nội dung tab Doanh thu của MỘT khách sạn: bộ lọc khoảng thời gian + groupBy,
 * KPI, biểu đồ xu hướng, và tóm tắt số dư ví.
 * Nối `GET /hotels/:id/revenue` + `GET /hotels/:id/wallet`.
 */
export function RevenueTab({ hotelId }: RevenueTabProps) {
  const [range, setRange] = useState<DateRangeValue>(() => resolvePreset('last30'));
  const [preset, setPreset] = useState<RangePreset>('last30');
  const [groupBy, setGroupBy] = useState<HotelRevenueGroupBy>('day');

  const revenueQuery = useHotelRevenue(hotelId, { ...range, groupBy });
  // Chỉ cần số dư ở trang này — sổ giao dịch nằm ở `/partner/wallet`, nên xin 1 dòng
  // thay vì cả trang giao dịch (endpoint luôn trả kèm `wallet` bất kể `limit`).
  const walletQuery = useHotelWallet(hotelId, { page: 1, limit: 1 });

  const summary = revenueQuery.data?.summary;
  const series = revenueQuery.data?.series ?? [];
  const hasSeries = series.some(p => Number(p.gross) > 0 || Number(p.net) > 0);

  const wallet = walletQuery.data?.wallet;

  return (
    <div className="space-y-6">
      {/* ─── Bộ lọc khoảng thời gian ─── */}
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
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            <KpiCard
              icon={Banknote}
              label="Gross revenue"
              value={formatCompactVnd(summary.gross)}
              full={formatVndFull(summary.gross)}
              iconColor="text-sky-600"
              iconBg="bg-sky-50"
            />
            <KpiCard
              icon={TrendingUp}
              label="Net revenue (after commission)"
              value={formatCompactVnd(summary.net)}
              full={formatVndFull(summary.net)}
              iconColor="text-emerald-600"
              iconBg="bg-emerald-50"
            />
            <KpiCard
              icon={Percent}
              label="Platform commission"
              value={formatCompactVnd(summary.commission)}
              full={formatVndFull(summary.commission)}
              iconColor="text-amber-600"
              iconBg="bg-amber-50"
            />
            <KpiCard
              icon={RotateCcw}
              label="Refunded"
              value={formatCompactVnd(summary.refunded)}
              full={formatVndFull(summary.refunded)}
              iconColor="text-red-500"
              iconBg="bg-red-50"
            />
            <KpiCard
              icon={Receipt}
              label="Bookings"
              value={summary.bookingCount.toLocaleString('vi-VN')}
              full={null}
              iconColor="text-role-partner-primary"
              iconBg="bg-role-partner-light"
            />
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

      {/*
        Ví đã tách sang trang riêng `/partner/wallet` (sổ giao dịch đầy đủ nằm ở đó).
        Ở đây chỉ giữ số dư để không mất bối cảnh — báo cáo doanh thu và số tiền đang có
        là hai câu hỏi khác nhau, gộp cả hai vào một trang khiến trang quá dài.
      */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-semibold text-slate-900">Wallet</h2>
          <Button variant="outline" size="sm" asChild>
            <Link to={`${ROUTES.partnerWallet}?hotelId=${hotelId}`}>
              Open wallet
              <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>

        {walletQuery.isError ? (
          <ErrorState label="Failed to load wallet." />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <BalanceCard
              icon={Wallet}
              label="Available balance"
              value={formatCurrency(wallet?.balanceAvailable)}
              tone="text-emerald-600"
            />
            <BalanceCard
              icon={Clock}
              label="Pending balance"
              value={formatCurrency(wallet?.balancePending)}
              tone="text-amber-600"
            />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

interface CardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  tone: string;
}

interface KpiCardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  /** Số đã rút gọn (vd `876K VNĐ`) — giữ card không vỡ dòng ở lưới 5 cột. */
  value: string;
  /** Số VND đầy đủ hiện khi hover; `null` khi giá trị không phải tiền. */
  full: string | null;
  iconColor: string;
  iconBg: string;
}

/** KPI card theo đúng khuôn của `manager/revenue`: ô icon màu → số lớn → nhãn. */
function KpiCard({ icon: Icon, label, value, full, iconColor, iconBg }: KpiCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className={cn('mb-3 w-fit rounded-lg p-2', iconBg)}>
        <Icon className={cn('h-5 w-5', iconColor)} />
      </div>
      {full ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <p className="w-fit cursor-default text-2xl font-bold text-slate-900">
              {value}
            </p>
          </TooltipTrigger>
          <TooltipContent>{full}</TooltipContent>
        </Tooltip>
      ) : (
        <p className="text-2xl font-bold text-slate-900">{value}</p>
      )}
      <p className="mt-1 text-xs text-slate-500">{label}</p>
    </div>
  );
}

function BalanceCard({ icon: Icon, label, value, tone }: CardProps) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white">
        <Icon className={cn('h-5 w-5', tone)} />
      </div>
      <div>
        <p className="text-xs font-medium text-slate-500">{label}</p>
        <p className={cn('text-xl font-bold tracking-tight', tone)}>{value}</p>
      </div>
    </div>
  );
}

function RevenueSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-80 rounded-xl" />
    </div>
  );
}
