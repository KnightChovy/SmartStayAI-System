import { useMemo, useState } from 'react';
import {
  AlertCircle,
  Banknote,
  ChevronLeft,
  ChevronRight,
  Search,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TableSkeleton } from '@/components/shared/skeletons';
import {
  REFUND_STATUS_CONFIG,
  isPartialRefund,
  isSystemReviewed,
} from '@/components/shared/refund-labels';
import { RefundPayoutModal } from '@/components/manager/refunds/RefundPayoutModal';
import { usePlatformRefunds } from '@/hooks/refunds';
import { useAdminHotels } from '@/hooks/admin';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/formatDate';
import type { Refund, RefundStatus } from '@/types/refund.types';

const PAGE_SIZE = 10;
const ALL_HOTELS = 'all';

type FilterStatus = 'all' | RefundStatus;

const FILTERS: { value: FilterStatus; label: string }[] = [
  { value: 'approved', label: 'To transfer' },
  { value: 'pending', label: 'Awaiting hotel' },
  { value: 'processed', label: 'Transferred' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'all', label: 'All' },
];

/**
 * Refunds (`/manager/refunds`) — hàng đợi CHUYỂN KHOẢN hoàn tiền toàn sàn.
 *
 * Vì sao Platform Manager chuyển tiền chứ không phải khách sạn: tiền khách trả nằm ở tài khoản
 * của platform (escrow), ví khách sạn chỉ là số ghi sổ. Khách sạn quyết định CÓ hoàn hay không,
 * Platform Manager THỰC THI. Nối `GET /platform-manager/refunds` + `PATCH .../process`.
 */
export default function ManagerRefundsPage() {
  const [status, setStatus] = useState<FilterStatus>('approved');
  const [hotelId, setHotelId] = useState<string>(ALL_HOTELS);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Refund | null>(null);

  const { data, isLoading, isError, refetch } = usePlatformRefunds({
    status: status === 'all' ? undefined : status,
    hotelId: hotelId === ALL_HOTELS ? undefined : hotelId,
    page,
    limit: PAGE_SIZE,
  });

  // BE không có endpoint riêng để đổ dropdown khách sạn — tái dùng danh sách giám sát của admin
  // (Platform Manager có quyền `manageHotels`).
  const { data: hotels } = useAdminHotels({ limit: 100 });

  const refunds = useMemo(() => data?.results ?? [], [data]);
  const totalPages = data?.totalPages ?? 1;
  const totalResults = data?.totalResults ?? 0;

  // BE không hỗ trợ search — lọc client-side trên trang hiện tại.
  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return refunds;
    return refunds.filter(
      r =>
        r.payment.booking.bookingCode.toLowerCase().includes(q) ||
        r.requesterUser.fullName.toLowerCase().includes(q) ||
        r.requesterUser.email.toLowerCase().includes(q) ||
        r.payment.booking.hotel.name.toLowerCase().includes(q)
    );
  }, [refunds, search]);

  const changeFilter = (next: FilterStatus) => {
    setStatus(next);
    setPage(1);
  };

  const changeHotel = (next: string) => {
    setHotelId(next);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-role-manager-light p-2">
            <Banknote className="h-6 w-6 text-role-manager-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Refunds</h1>
            <p className="text-sm text-slate-500">
              Transfer approved refunds back to guests and record the bank reference
            </p>
          </div>
          {totalResults > 0 && (
            <span className="ml-auto rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-400">
              {totalResults} total
            </span>
          )}
        </div>
        <p className="mt-4 rounded-lg border border-slate-200 bg-slate-50/60 px-3.5 py-2.5 text-xs text-slate-500">
          Guest money sits in the <strong>platform&apos;s</strong> account (escrow), so hotels have
          no money to send back themselves. The hotel decides <em>whether</em> to refund; you
          execute the transfer.
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
                {f.value === 'approved' && status === 'approved' && totalResults > 0 && (
                  <span className="ml-1.5 rounded-full bg-white/25 px-1.5 text-xs">
                    {totalResults}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <Select value={hotelId} onValueChange={changeHotel}>
              <SelectTrigger className="w-full sm:w-52">
                <SelectValue placeholder="All hotels" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_HOTELS}>All hotels</SelectItem>
                {(hotels?.results ?? []).map(h => (
                  <SelectItem key={h.id} value={h.id}>
                    {h.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="relative w-full sm:w-60">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search booking, guest or hotel..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-sm focus:border-role-manager-primary focus:outline-none focus:ring-2 focus:ring-role-manager-primary/30"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        {isLoading && !data ? (
          <TableSkeleton rows={6} columns={7} className="rounded-none border-0" />
        ) : isError ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20">
            <AlertCircle className="h-8 w-8 text-red-400" />
            <p className="text-sm text-slate-500">Failed to load refund requests</p>
            <Button variant="outline" className="text-xs" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <Th>Hotel</Th>
                  <Th>Booking</Th>
                  <Th>Guest</Th>
                  <Th align="right">Refund</Th>
                  <Th>Status</Th>
                  <Th>Requested</Th>
                  <Th align="right">Actions</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      {search
                        ? 'No refund on this page matches your search'
                        : status === 'approved'
                          ? 'Nothing to transfer right now'
                          : 'No refund requests with this status'}
                    </td>
                  </tr>
                ) : (
                  rows.map(r => {
                    const cfg = REFUND_STATUS_CONFIG[r.status];
                    const StatusIcon = cfg.icon;
                    return (
                      <tr
                        key={r.id}
                        onClick={() => setSelected(r)}
                        className="cursor-pointer transition-colors hover:bg-slate-50/60"
                      >
                        <td className="px-5 py-4">
                          <p className="font-medium text-slate-800">{r.payment.booking.hotel.name}</p>
                          <p className="text-xs text-slate-400">{r.payment.booking.hotel.city}</p>
                        </td>
                        <td className="px-5 py-4">
                          <p className="font-mono text-xs font-semibold text-slate-700">
                            {r.payment.booking.bookingCode}
                          </p>
                          <p className="text-xs text-slate-400">
                            {r.payment.booking.roomType.name}
                          </p>
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-slate-700">{r.requesterUser.fullName}</p>
                          <p className="text-xs text-slate-400">
                            {r.requesterUser.phone ?? r.requesterUser.email}
                          </p>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <p className="font-semibold tabular-nums text-red-600">
                            {formatCurrency(r.amount)}
                          </p>
                          <p className="text-xs text-slate-400">
                            of {formatCurrency(r.payment.amount)}
                            {isPartialRefund(r) && ' · partial'}
                          </p>
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={cn(
                              'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold',
                              cfg.class
                            )}
                          >
                            <StatusIcon className="h-3 w-3" />
                            {cfg.label}
                          </span>
                          {isSystemReviewed(r) && r.status !== 'pending' && (
                            <p className="mt-1 text-[10px] text-slate-400">Auto by system</p>
                          )}
                        </td>
                        <td className="px-5 py-4 text-slate-500">
                          <p className="text-xs">{formatDate(r.createdAt)}</p>
                          {r.processedAt && (
                            <p className="font-mono text-[10px] text-slate-400">
                              ref {r.refundTransactionId}
                            </p>
                          )}
                        </td>
                        <td className="px-5 py-4" onClick={e => e.stopPropagation()}>
                          <div className="flex justify-end">
                            {r.status === 'approved' ? (
                              <Button
                                size="sm"
                                onClick={() => setSelected(r)}
                                className="bg-role-manager-primary text-xs text-white hover:bg-role-manager-secondary"
                              >
                                <Banknote className="mr-1 h-3.5 w-3.5" />
                                Transfer
                              </Button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setSelected(r)}
                                className="rounded-lg px-3 py-1.5 text-xs font-medium text-role-manager-primary transition-colors hover:bg-role-manager-light"
                              >
                                View
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!isLoading && !isError && totalPages > 0 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 text-xs text-slate-400">
            <span>
              Showing {rows.length} of {totalResults} requests
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded p-1 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Previous page"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="font-medium text-slate-600">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="rounded p-1 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Next page"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {selected && <RefundPayoutModal refund={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function Th({
  children,
  align = 'left',
}: {
  children: React.ReactNode;
  align?: 'left' | 'right';
}) {
  return (
    <th
      className={cn(
        'px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-600',
        align === 'right' ? 'text-right' : 'text-left'
      )}
    >
      {children}
    </th>
  );
}
