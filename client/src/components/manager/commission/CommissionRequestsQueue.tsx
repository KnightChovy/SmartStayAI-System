import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Inbox, Search } from 'lucide-react';
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
  COMMISSION_STATUS_CONFIG,
  formatRate,
} from '@/components/shared/commission-labels';
import { useCommissionRequests } from '@/hooks/platform-manager';
import { useAdminHotels } from '@/hooks/admin';
import { cn } from '@/lib/cn';
import { formatDate } from '@/utils/formatDate';
import type {
  CommissionRateRequest,
  CommissionRequestStatus,
} from '@/types/commission-rate.types';
import { ReviewRequestModal } from './ReviewRequestModal';

const PAGE_SIZE = 10;
const ALL_HOTELS = 'all';

type FilterStatus = 'all' | CommissionRequestStatus;

const FILTERS: { value: FilterStatus; label: string }[] = [
  { value: 'pending', label: 'Needs review' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'all', label: 'All' },
];

/**
 * Hàng chờ duyệt đơn hoa hồng. Backend trả CŨ NHẤT TRƯỚC (không phải mới nhất) để
 * không đối tác nào bị bỏ quên — giữ nguyên thứ tự đó, không sort lại ở client.
 */
export function CommissionRequestsQueue() {
  const [status, setStatus] = useState<FilterStatus>('pending');
  const [hotelId, setHotelId] = useState<string>(ALL_HOTELS);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<CommissionRateRequest | null>(null);

  const { data, isLoading, isError, refetch } = useCommissionRequests({
    status: status === 'all' ? undefined : status,
    hotelId: hotelId === ALL_HOTELS ? undefined : hotelId,
    page,
    limit: PAGE_SIZE,
  });

  // Backend không có endpoint riêng để đổ dropdown khách sạn — tái dùng danh sách giám sát
  // của admin (Platform Manager có quyền `manageHotels`).
  const { data: hotels } = useAdminHotels({ limit: 100 });

  const requests = useMemo(() => data?.results ?? [], [data]);
  const totalPages = data?.totalPages ?? 1;
  const totalResults = data?.totalResults ?? 0;

  // Backend không hỗ trợ search — lọc client-side trên trang hiện tại.
  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return requests;
    return requests.filter(
      r =>
        r.hotel.name.toLowerCase().includes(q) ||
        r.hotel.city.toLowerCase().includes(q) ||
        (r.requestedByUser.fullName?.toLowerCase().includes(q) ?? false) ||
        r.requestedByUser.email.toLowerCase().includes(q)
    );
  }, [requests, search]);

  const changeFilter = (next: FilterStatus) => {
    setStatus(next);
    setPage(1);
  };

  const changeHotel = (next: string) => {
    setHotelId(next);
    setPage(1);
  };

  return (
    <div className="space-y-4">
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
                placeholder="Search hotel or submitter..."
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
          <TableSkeleton
            rows={5}
            columns={6}
            className="rounded-none border-0"
          />
        ) : isError ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20">
            <p className="text-sm text-slate-500">
              Failed to load commission requests.
            </p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <Th>Hotel</Th>
                  <Th>Submitted by</Th>
                  <Th align="center">Current → requested</Th>
                  <Th>Reason</Th>
                  <Th>Submitted</Th>
                  <Th>Status</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center">
                      <Inbox className="mx-auto mb-3 h-8 w-8 text-slate-300" />
                      <p className="text-slate-400">
                        {search
                          ? 'No request on this page matches your search'
                          : status === 'pending'
                            ? 'Nothing waiting for your review'
                            : 'No requests with this status'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  rows.map(r => {
                    const cfg = COMMISSION_STATUS_CONFIG[r.status];
                    const StatusIcon = cfg.icon;
                    return (
                      <tr
                        key={r.id}
                        onClick={() => setSelected(r)}
                        className="cursor-pointer transition-colors hover:bg-slate-50/60"
                      >
                        <td className="px-5 py-4">
                          <p className="font-medium text-slate-800">
                            {r.hotel.name}
                          </p>
                          <p className="text-xs text-slate-400">
                            {r.hotel.city}
                          </p>
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-slate-700">
                            {r.requestedByUser.fullName ?? '—'}
                          </p>
                          <p className="text-xs text-slate-400">
                            {r.requestedByUser.email}
                          </p>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <p className="whitespace-nowrap tabular-nums">
                            <span className="text-slate-400">
                              {formatRate(r.currentRate)}
                            </span>
                            <span className="mx-1.5 text-slate-300">→</span>
                            <span className="font-semibold text-emerald-600">
                              {formatRate(r.requestedRate)}
                            </span>
                          </p>
                          {r.isRenewal && (
                            <span className="mt-1 inline-block rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                              Renewal
                            </span>
                          )}
                        </td>
                        <td className="max-w-[260px] px-5 py-4">
                          <p
                            className="truncate text-xs text-slate-600"
                            title={r.reason}
                          >
                            {r.reason}
                          </p>
                        </td>
                        <td className="px-5 py-4 text-xs text-slate-500">
                          {formatDate(r.createdAt)}
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
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

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

      {selected && (
        <ReviewRequestModal
          request={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}

const TH_ALIGN = {
  left: 'text-left',
  right: 'text-right',
  center: 'text-center',
} as const;

function Th({
  children,
  align = 'left',
}: {
  children: React.ReactNode;
  align?: keyof typeof TH_ALIGN;
}) {
  return (
    <th
      className={cn(
        'px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-600',
        TH_ALIGN[align]
      )}
    >
      {children}
    </th>
  );
}
