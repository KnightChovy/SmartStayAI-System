import { useMemo, useState } from 'react';
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  HandCoins,
  Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TableSkeleton } from '@/components/shared/skeletons';
import { PayoutReviewModal } from '@/components/manager/payouts/PayoutReviewModal';
import { PAYOUT_STATUS_CONFIG } from '@/components/hotel-partner/wallet/payout-labels';
import { Pill } from '@/components/hotel-partner/shared/Pill';
import { usePlatformPayouts } from '@/hooks/payouts';
import { cn } from '@/lib/cn';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/formatDate';
import type { PayoutStatus, PlatformPayout } from '@/types/payout.types';

const PAGE_SIZE = 10;

type FilterStatus = 'all' | PayoutStatus;

/** Việc cần làm đứng trước, lịch sử đứng sau — mặc định mở đúng hàng chờ. */
const FILTERS: { value: FilterStatus; label: string }[] = [
  { value: 'pending', label: 'To pay' },
  { value: 'paid', label: 'Paid' },
  { value: 'failed', label: 'Declined' },
  { value: 'all', label: 'All' },
];

/**
 * Payouts (`/manager/payouts`) — hàng chờ CHUYỂN TIỀN cho khách sạn.
 *
 * Đây là **điểm duyệt tay duy nhất** còn lại trong luồng tiền: tất toán hoa hồng
 * (pending → available) đã chuyển sang cron tự động, endpoint duyệt từng khoản đã bị gỡ.
 * Khách sạn tạo yêu cầu rút → tiền được giữ khỏi số dư của họ ngay → Platform Manager chuyển
 * khoản tay rồi ghi nhận ở đây.
 */
export default function ManagerPayoutsPage() {
  const [status, setStatus] = useState<FilterStatus>('pending');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<PlatformPayout | null>(null);

  const { data, isLoading, isError, refetch } = usePlatformPayouts({
    status: status === 'all' ? undefined : status,
    page,
    limit: PAGE_SIZE,
  });

  const payouts = useMemo(() => data?.results ?? [], [data]);
  const totalPages = data?.totalPages ?? 1;
  const totalResults = data?.totalResults ?? 0;

  // BE không có tham số `search` — lọc client-side trên TRANG hiện tại, và nói rõ điều đó
  // để không ai tưởng đang tìm toàn sàn.
  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return payouts;
    return payouts.filter(
      p =>
        p.hotel.name.toLowerCase().includes(q) ||
        p.hotel.city.toLowerCase().includes(q) ||
        p.payoutAccount.accountHolder.toLowerCase().includes(q) ||
        p.payoutAccount.bankName.toLowerCase().includes(q)
    );
  }, [payouts, search]);

  const pendingTotal = useMemo(
    () =>
      status === 'pending'
        ? payouts.reduce((sum, p) => sum + Number(p.amount), 0)
        : null,
    [payouts, status]
  );

  const changeFilter = (next: FilterStatus) => {
    setStatus(next);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-role-manager-light p-2">
            <HandCoins className="h-6 w-6 text-role-manager-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Payouts</h1>
            <p className="text-sm text-slate-500">
              Transfer requested earnings to hotels and record the bank reference
            </p>
          </div>
          {/* Tổng của TRANG đang xem, nói rõ vậy — không phải tổng toàn hàng chờ. */}
          {pendingTotal !== null && pendingTotal > 0 && (
            <div className="ml-auto rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2 text-right">
              <p className="text-[11px] text-amber-700">On this page</p>
              <p className="text-sm font-bold tabular-nums text-amber-800">
                {formatCurrency(pendingTotal)}
              </p>
            </div>
          )}
        </div>
        <p className="mt-4 rounded-lg border border-slate-200 bg-slate-50/60 px-3.5 py-2.5 text-xs text-slate-500">
          Guest money sits in the <strong>platform&apos;s</strong> account, so hotels
          cannot pay themselves. The amount already left their available balance
          when they requested it — approving here only records a transfer{' '}
          <strong>you</strong> have made.
        </p>
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex flex-wrap gap-2">
            {FILTERS.map(f => (
              <button
                key={f.value}
                type="button"
                onClick={() => changeFilter(f.value)}
                className={cn(
                  'rounded-full px-4 py-1.5 text-sm font-medium transition-all',
                  status === f.value
                    ? 'bg-role-manager-primary text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                )}
              >
                {f.label}
                {f.value === 'pending' &&
                  status === 'pending' &&
                  totalResults > 0 && (
                    <span className="ml-1.5 rounded-full bg-white/25 px-1.5 text-xs">
                      {totalResults}
                    </span>
                  )}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Filter this page by hotel or bank..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-sm focus:border-role-manager-primary focus:outline-none focus:ring-2 focus:ring-role-manager-primary/30"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        {isLoading && !data ? (
          <TableSkeleton rows={6} columns={6} className="rounded-none border-0" />
        ) : isError ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20">
            <AlertCircle className="h-8 w-8 text-red-400" />
            <p className="text-sm text-slate-500">
              Failed to load payout requests
            </p>
            <Button
              variant="outline"
              className="text-xs"
              onClick={() => refetch()}
            >
              Retry
            </Button>
          </div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-20 text-center">
            <div className="mb-1 flex size-12 items-center justify-center rounded-full bg-slate-100">
              <HandCoins className="h-6 w-6 text-slate-300" />
            </div>
            <p className="text-sm text-slate-500">
              {search.trim()
                ? 'Nothing on this page matches your filter'
                : status === 'pending'
                  ? 'No payouts waiting — you are all caught up'
                  : 'No payout requests here'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-200 text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3 text-left">Hotel</th>
                  <th className="px-4 py-3 text-left">Pay to</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Requested</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map(p => {
                  const config = PAYOUT_STATUS_CONFIG[p.status];
                  return (
                    <tr
                      key={p.id}
                      onClick={() => setSelected(p)}
                      className="cursor-pointer transition-colors hover:bg-slate-50/60"
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-900">
                          {p.hotel.name}
                        </p>
                        <p className="text-xs text-slate-400">{p.hotel.city}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-slate-700">
                          {p.payoutAccount.accountHolder}
                        </p>
                        <p className="text-xs text-slate-400">
                          {p.payoutAccount.bankName}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold tabular-nums text-slate-900">
                        {formatCurrency(p.amount)}
                      </td>
                      <td className="px-4 py-3">
                        <Pill tone={config.tone}>{config.label}</Pill>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                        {formatDate(p.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          size="sm"
                          variant={p.status === 'pending' ? 'default' : 'outline'}
                          onClick={e => {
                            e.stopPropagation();
                            setSelected(p);
                          }}
                          className={cn(
                            'text-xs',
                            p.status === 'pending' &&
                              'bg-role-manager-primary text-white hover:bg-role-manager-secondary'
                          )}
                        >
                          {p.status === 'pending' ? 'Review' : 'View'}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-xs text-slate-500">
            <span>
              Page {page} of {totalPages} · {totalResults} request
              {totalResults === 1 ? '' : 's'}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* `key` theo id: mở yêu cầu khác là remount, không mang theo lý do đã gõ dở. */}
      <PayoutReviewModal
        key={selected?.id ?? 'none'}
        payout={selected}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}
