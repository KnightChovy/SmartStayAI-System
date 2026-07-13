import { useMemo, useState } from 'react';
import {
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
import { DatePicker } from '@/components/ui/date-picker';
import { Skeleton } from '@/components/ui/skeleton';
import { DataTable, type Column } from '@/components/hotel-partner/shared/DataTable';
import { Pill } from '@/components/hotel-partner/shared/Pill';
import { ErrorState } from '@/components/hotel-partner/shared/states';
import { TableSkeleton } from '@/components/shared/skeletons';
import { cn } from '@/lib/cn';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate, toDateInputValue } from '@/utils/formatDate';
import type {
  HotelRevenueGroupBy,
  WalletTransaction,
  WalletTransactionType,
} from '@/types/hotel-revenue.types';
import { RevenueTrendChart } from './RevenueTrendChart';
import { WALLET_TXN_CONFIG, WALLET_TXN_OPTIONS, isPositiveTxn } from './labels';

const TXN_PAGE_SIZE = 10;

/** Ngày đầu tháng hiện tại (YYYY-MM-DD). */
function firstOfMonth(): string {
  const now = new Date();
  return toDateInputValue(new Date(now.getFullYear(), now.getMonth(), 1));
}

interface RevenueTabProps {
  hotelId: string;
}

/**
 * Nội dung tab Doanh thu của MỘT khách sạn: bộ lọc khoảng thời gian + groupBy,
 * KPI, biểu đồ xu hướng, số dư ví và sổ giao dịch.
 * Nối `GET /hotels/:id/revenue` + `GET /hotels/:id/wallet`.
 */
export function RevenueTab({ hotelId }: RevenueTabProps) {
  const [from, setFrom] = useState<string>(firstOfMonth);
  const [to, setTo] = useState<string>(() => toDateInputValue(new Date()));
  const [groupBy, setGroupBy] = useState<HotelRevenueGroupBy>('day');
  const [txnType, setTxnType] = useState<WalletTransactionType | ''>('');
  const [txnPage, setTxnPage] = useState(1);

  const revenueQuery = useHotelRevenue(hotelId, { from, to, groupBy });
  const walletQuery = useHotelWallet(hotelId, {
    page: txnPage,
    limit: TXN_PAGE_SIZE,
    type: txnType || undefined,
  });

  const summary = revenueQuery.data?.summary;
  const series = revenueQuery.data?.series ?? [];
  const hasSeries = series.some(p => Number(p.gross) > 0 || Number(p.net) > 0);

  const wallet = walletQuery.data?.wallet;
  const txns = walletQuery.data?.transactions;

  const columns = useMemo<Column<WalletTransaction>[]>(
    () => [
      {
        id: 'type',
        header: 'Type',
        cell: t => {
          const cfg = WALLET_TXN_CONFIG[t.type];
          return <Pill tone={cfg.tone}>{cfg.label}</Pill>;
        },
      },
      {
        id: 'description',
        header: 'Description',
        cell: t => (
          <span className="text-slate-600">{t.description ?? '—'}</span>
        ),
        className: 'max-w-[280px] truncate',
      },
      {
        id: 'amount',
        header: 'Amount',
        align: 'right',
        cell: t => {
          const positive = isPositiveTxn(t.type);
          return (
            <span
              className={cn(
                'font-semibold tabular-nums',
                positive ? 'text-emerald-600' : 'text-red-600'
              )}
            >
              {positive ? '+' : '−'}
              {formatCurrency(t.amount)}
            </span>
          );
        },
      },
      {
        id: 'balanceAfter',
        header: 'Balance after',
        align: 'right',
        cell: t => (
          <span className="tabular-nums text-slate-700">{formatCurrency(t.balanceAfter)}</span>
        ),
      },
      {
        id: 'createdAt',
        header: 'Date',
        cell: t => <span className="text-slate-500">{formatDate(t.createdAt)}</span>,
      },
    ],
    []
  );

  const changeType = (value: WalletTransactionType | '') => {
    setTxnType(value);
    setTxnPage(1);
  };

  return (
    <div className="space-y-6">
      {/* ─── Bộ lọc khoảng thời gian ─── */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-40">
          <label className="mb-1 block text-xs font-medium text-slate-500">From</label>
          <DatePicker value={from} onChange={setFrom} max={to} clearable={false} />
        </div>
        <div className="w-40">
          <label className="mb-1 block text-xs font-medium text-slate-500">To</label>
          <DatePicker value={to} onChange={setTo} min={from} clearable={false} />
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-slate-200 p-1">
          {(['day', 'month'] as const).map(g => (
            <button
              key={g}
              type="button"
              onClick={() => setGroupBy(g)}
              className={cn(
                'rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors',
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
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
            <KpiCard
              icon={Banknote}
              label="Gross revenue"
              value={formatCurrency(summary.gross)}
              tone="text-sky-600"
            />
            <KpiCard
              icon={TrendingUp}
              label="Net (after commission)"
              value={formatCurrency(summary.net)}
              tone="text-emerald-600"
            />
            <KpiCard
              icon={Percent}
              label="Commission"
              value={formatCurrency(summary.commission)}
              tone="text-amber-600"
            />
            <KpiCard
              icon={RotateCcw}
              label="Refunded"
              value={formatCurrency(summary.refunded)}
              tone="text-red-500"
            />
            <KpiCard
              icon={Receipt}
              label="Bookings"
              value={String(summary.bookingCount)}
              tone="text-slate-700"
            />
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <h2 className="mb-4 font-semibold text-slate-900">Revenue trend</h2>
            {hasSeries ? (
              <RevenueTrendChart series={series} />
            ) : (
              <p className="py-16 text-center text-sm text-slate-400">
                No revenue in this period yet.
              </p>
            )}
          </div>
        </>
      )}

      {/* ─── Ví + giao dịch ─── */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-semibold text-slate-900">Wallet</h2>
          <select
            value={txnType}
            onChange={e => changeType(e.target.value as WalletTransactionType | '')}
            className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-600"
          >
            <option value="">All transaction types</option>
            {WALLET_TXN_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        {walletQuery.isError ? (
          <ErrorState label="Failed to load wallet." />
        ) : (
          <>
            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
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

            {walletQuery.isLoading && !txns ? (
              <TableSkeleton rows={5} columns={5} />
            ) : txns && txns.results.length > 0 ? (
              <>
                <DataTable
                  columns={columns}
                  rows={txns.results}
                  rowKey={t => t.id}
                  minWidthClass="min-w-[720px]"
                />
                <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
                  <span>
                    Page {txns.page} of {txns.totalPages} · {txns.totalResults} transactions
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={txns.page <= 1}
                      onClick={() => setTxnPage(p => Math.max(1, p - 1))}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={txns.page >= txns.totalPages}
                      onClick={() => setTxnPage(p => p + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <p className="py-10 text-center text-sm text-slate-400">No transactions yet.</p>
            )}
          </>
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

function KpiCard({ icon: Icon, label, value, tone }: CardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="mb-2 flex items-center gap-2">
        <Icon className={cn('h-4 w-4', tone)} />
        <span className="text-xs font-medium text-slate-500">{label}</span>
      </div>
      <p className={cn('text-lg font-bold tracking-tight', tone)}>{value}</p>
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
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-80 rounded-xl" />
    </div>
  );
}
