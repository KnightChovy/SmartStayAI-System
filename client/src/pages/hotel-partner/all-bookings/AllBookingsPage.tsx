import { useEffect, useMemo, useState } from 'react';
import { ClipboardList, Search } from 'lucide-react';
import { usePartnerBookings } from '@/hooks/partner-bookings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DatePicker } from '@/components/ui/date-picker';
import { DataTable, type Column } from '@/components/hotel-partner/shared/DataTable';
import { Pill, type PillTone } from '@/components/hotel-partner/shared/Pill';
import { ErrorState } from '@/components/hotel-partner/shared/states';
import { TableSkeleton } from '@/components/shared/skeletons';
import { formatDate } from '@/utils/formatDate';
import { formatCurrency } from '@/utils/formatCurrency';
import type {
  PlatformBooking,
  PlatformBookingStatus,
} from '@/types/platform-manager.types';

const STATUS_CONFIG: Record<PlatformBookingStatus, { label: string; tone: PillTone }> = {
  pending: { label: 'Pending', tone: 'amber' },
  confirmed: { label: 'Confirmed', tone: 'emerald' },
  checked_in: { label: 'Checked in', tone: 'blue' },
  checked_out: { label: 'Checked out', tone: 'violet' },
  cancelled: { label: 'Cancelled', tone: 'red' },
  no_show: { label: 'No show', tone: 'slate' },
};

const PAGE_SIZE = 20;

function guestName(b: PlatformBooking): string {
  return b.customer?.fullName ?? b.customer?.email ?? '—';
}

/**
 * All Bookings (`/partner/all-bookings`) — bookings gộp TOÀN BỘ khách sạn của partner,
 * lọc server-side theo status / khoảng ngày / từ khoá. Nối `GET /hotel-partners/me/bookings`.
 */
export default function AllBookingsPage() {
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<PlatformBookingStatus | ''>('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);

  // Debounce ô tìm kiếm để không spam request.
  useEffect(() => {
    const id = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(id);
  }, [searchInput]);

  // Đổi filter → về trang 1.
  useEffect(() => {
    setPage(1);
  }, [search, status, from, to]);

  const params = useMemo(
    () => ({
      status: status || undefined,
      search: search || undefined,
      fromDate: from || undefined,
      toDate: to || undefined,
      sortBy: 'createdAt:desc',
      page,
      limit: PAGE_SIZE,
    }),
    [status, search, from, to, page]
  );

  const { data, isLoading, isError, refetch, isFetching } = usePartnerBookings(params);

  const columns: Column<PlatformBooking>[] = [
    {
      id: 'code',
      header: 'Booking ID',
      cell: b => (
        <span className="font-mono text-xs font-semibold text-role-partner-primary">
          {b.bookingCode}
        </span>
      ),
    },
    {
      id: 'hotel',
      header: 'Hotel',
      cell: b => (
        <div className="min-w-0">
          <p className="max-w-[180px] truncate font-medium text-slate-800">{b.hotel.name}</p>
          <p className="text-xs text-slate-400">{b.hotel.city}</p>
        </div>
      ),
    },
    { id: 'guest', header: 'Guest', cell: b => <span className="text-slate-700">{guestName(b)}</span> },
    {
      id: 'checkIn',
      header: 'Check-in',
      className: 'hidden sm:table-cell',
      cell: b => <span className="text-slate-600">{formatDate(b.checkInDate)}</span>,
    },
    {
      id: 'checkOut',
      header: 'Check-out',
      className: 'hidden sm:table-cell',
      cell: b => <span className="text-slate-600">{formatDate(b.checkOutDate)}</span>,
    },
    {
      id: 'amount',
      header: 'Amount',
      align: 'right',
      cell: b => (
        <span className="font-semibold text-slate-800">{formatCurrency(b.totalAmount)}</span>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      cell: b => {
        const cfg = STATUS_CONFIG[b.status];
        return <Pill tone={cfg.tone}>{cfg.label}</Pill>;
      },
    },
    {
      id: 'created',
      header: 'Created',
      className: 'hidden lg:table-cell',
      cell: b => <span className="text-xs text-slate-400">{formatDate(b.createdAt)}</span>,
    },
  ];

  return (
    <div className="mx-auto w-full max-w-[1400px] rounded-xl border border-slate-200 bg-white p-6">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-role-partner-light">
          <ClipboardList className="h-6 w-6 text-role-partner-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">All Bookings</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Every booking across all your hotels.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder="Search booking ID, guest name or email..."
            className="h-11 pl-8.5"
          />
        </div>
        <select
          value={status}
          onChange={e => setStatus(e.target.value as PlatformBookingStatus | '')}
          className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-600"
        >
          <option value="">All statuses</option>
          {(Object.keys(STATUS_CONFIG) as PlatformBookingStatus[]).map(s => (
            <option key={s} value={s}>
              {STATUS_CONFIG[s].label}
            </option>
          ))}
        </select>
        <div className="w-40">
          <label className="mb-1 block text-xs font-medium text-slate-500">Check-in from</label>
          <DatePicker value={from} onChange={setFrom} max={to || undefined} placeholder="Any" />
        </div>
        <div className="w-40">
          <label className="mb-1 block text-xs font-medium text-slate-500">Check-in to</label>
          <DatePicker value={to} onChange={setTo} min={from || undefined} placeholder="Any" />
        </div>
      </div>

      {isError ? (
        <div className="py-14 text-center">
          <ErrorState label="Could not load bookings." />
          <Button variant="outline" onClick={() => refetch()} className="mt-2">
            Try again
          </Button>
        </div>
      ) : isLoading && !data ? (
        <TableSkeleton rows={8} columns={6} />
      ) : data && data.results.length > 0 ? (
        <>
          <DataTable
            columns={columns}
            rows={data.results}
            rowKey={b => b.id}
            minWidthClass="min-w-[820px]"
          />
          <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
            <span>
              Page {data.page} of {data.totalPages} · {data.totalResults} bookings
              {isFetching && !isLoading ? ' · refreshing…' : ''}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={data.page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={data.page >= data.totalPages}
                onClick={() => setPage(p => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </>
      ) : (
        <p className="py-16 text-center text-sm text-slate-400">No bookings found.</p>
      )}
    </div>
  );
}
