import { useMemo, useState } from 'react';
import { CalendarCheck, Search } from 'lucide-react';

import { cn } from '@/lib/cn';
import { formatDate } from '@/utils/formatDate';
import { formatCurrency } from '@/utils/formatCurrency';
import { usePlatformBookings } from '@/hooks/platform-manager';
import { TableSkeleton } from '@/components/shared/skeletons';
import type {
  PlatformBooking,
  PlatformBookingStatus,
} from '@/types/platform-manager.types';

const bookingStatusConfig: Record<
  PlatformBookingStatus,
  { label: string; class: string }
> = {
  pending: { label: 'Pending', class: 'bg-amber-100 text-amber-700' },
  confirmed: { label: 'Confirmed', class: 'bg-emerald-100 text-emerald-700' },
  checked_in: { label: 'Checked in', class: 'bg-blue-100 text-blue-700' },
  checked_out: { label: 'Checked out', class: 'bg-indigo-100 text-indigo-700' },
  cancelled: { label: 'Cancelled', class: 'bg-red-100 text-red-700' },
  no_show: { label: 'No show', class: 'bg-slate-200 text-slate-600' },
};

/** 4 ô thống kê chính theo vòng đời booking. */
const summaryCards: {
  key: PlatformBookingStatus;
  label: string;
  color: string;
}[] = [
  { key: 'confirmed', label: 'Confirmed', color: 'text-emerald-600' },
  { key: 'checked_out', label: 'Checked out', color: 'text-indigo-600' },
  { key: 'pending', label: 'Pending', color: 'text-amber-600' },
  { key: 'cancelled', label: 'Cancelled', color: 'text-red-600' },
];

type StatusFilter = 'all' | PlatformBookingStatus;

function guestName(b: PlatformBooking): string {
  return b.customer?.fullName ?? b.customer?.email ?? '—';
}

// ─── Tab: Booking Activities (giám sát booking toàn sàn) ─────────────────────
export function BookingActivitiesTab() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [hotelFilter, setHotelFilter] = useState<string>('all');

  const { data, isLoading, isError, refetch, isFetching } = usePlatformBookings(
    {
      limit: 100,
      sortBy: 'createdAt:desc',
    }
  );
  const all = useMemo(() => data?.results ?? [], [data]);

  // Danh sách khách sạn duy nhất suy từ dữ liệu đang có (cho dropdown lọc).
  const hotels = useMemo(() => {
    const map = new Map<string, string>();
    all.forEach(b => map.set(b.hotel.id, b.hotel.name));
    return [...map.entries()].map(([id, name]) => ({ id, name }));
  }, [all]);

  const filtered = all.filter(b => {
    const q = search.toLowerCase();
    const matchSearch =
      b.bookingCode.toLowerCase().includes(q) ||
      guestName(b).toLowerCase().includes(q) ||
      b.hotel.name.toLowerCase().includes(q);
    const matchStatus = statusFilter === 'all' || b.status === statusFilter;
    const matchHotel = hotelFilter === 'all' || b.hotel.id === hotelFilter;
    return matchSearch && matchStatus && matchHotel;
  });

  const counts = useMemo(() => {
    const acc: Record<PlatformBookingStatus, number> = {
      pending: 0,
      confirmed: 0,
      checked_in: 0,
      checked_out: 0,
      cancelled: 0,
      no_show: 0,
    };
    all.forEach(b => {
      acc[b.status] += 1;
    });
    return acc;
  }, [all]);

  return (
    <div className="space-y-4">
      {/* Booking Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map(c => (
          <div
            key={c.key}
            className="bg-white rounded-xl border border-slate-200 p-4 text-center"
          >
            <p className={cn('text-3xl font-bold', c.color)}>{counts[c.key]}</p>
            <p className="text-sm text-slate-500 mt-1">{c.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
          <div className="relative flex-1 min-w-50">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search booking ID, guest, hotel..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-role-manager-primary/30 focus:border-role-manager-primary"
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as StatusFilter)}
            className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 text-slate-600 focus:outline-none focus:ring-2 focus:ring-role-manager-primary/30"
          >
            <option value="all">All statuses</option>
            {(Object.keys(bookingStatusConfig) as PlatformBookingStatus[]).map(
              s => (
                <option key={s} value={s}>
                  {bookingStatusConfig[s].label}
                </option>
              )
            )}
          </select>
          <select
            value={hotelFilter}
            onChange={e => setHotelFilter(e.target.value)}
            className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 text-slate-600 focus:outline-none focus:ring-2 focus:ring-role-manager-primary/30"
          >
            <option value="all">All hotels</option>
            {hotels.map(h => (
              <option key={h.id} value={h.id}>
                {h.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Booking Activity Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center gap-2">
          <CalendarCheck className="w-5 h-5 text-role-manager-primary" />
          <h2 className="font-semibold text-slate-900">
            Recent Booking Activities
          </h2>
          <span className="ml-auto text-xs text-slate-400">
            {filtered.length} bookings
            {isFetching && !isLoading ? ' · refreshing…' : ''}
          </span>
        </div>

        {isLoading ? (
          <div className="p-5">
            <TableSkeleton rows={6} columns={8} className="border-0" />
          </div>
        ) : isError ? (
          <div className="py-14 text-center">
            <p className="text-slate-500 mb-3">Could not load bookings.</p>
            <button
              onClick={() => refetch()}
              className="px-4 py-1.5 rounded-lg bg-role-manager-primary text-white text-sm font-medium"
            >
              Try again
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    {[
                      'Booking ID',
                      'Hotel',
                      'Guest',
                      'Check-in',
                      'Check-out',
                      'Amount',
                      'Status',
                      'Created',
                    ].map(h => (
                      <th
                        key={h}
                        className="text-left px-5 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.length === 0 ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="text-center py-12 text-slate-400"
                      >
                        No bookings found
                      </td>
                    </tr>
                  ) : (
                    filtered.map(b => {
                      const cfg = bookingStatusConfig[b.status];
                      return (
                        <tr
                          key={b.id}
                          className="hover:bg-slate-50/60 transition-colors"
                        >
                          <td className="px-5 py-3.5 font-mono text-xs font-semibold text-role-manager-primary">
                            {b.bookingCode}
                          </td>
                          <td className="px-5 py-3.5">
                            <p className="font-medium text-slate-800 max-w-[160px] truncate">
                              {b.hotel.name}
                            </p>
                            <p className="text-xs text-slate-400">
                              {b.hotel.city}
                            </p>
                          </td>
                          <td className="px-5 py-3.5 text-slate-700">
                            {guestName(b)}
                          </td>
                          <td className="px-5 py-3.5 text-slate-600">
                            {formatDate(b.checkInDate)}
                          </td>
                          <td className="px-5 py-3.5 text-slate-600">
                            {formatDate(b.checkOutDate)}
                          </td>
                          <td className="px-5 py-3.5 font-semibold text-slate-800">
                            {formatCurrency(b.totalAmount)}
                          </td>
                          <td className="px-5 py-3.5">
                            <span
                              className={cn(
                                'text-xs font-semibold px-2.5 py-1 rounded-full',
                                cfg.class
                              )}
                            >
                              {cfg.label}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-slate-400 text-xs">
                            {formatDate(b.createdAt)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
              <span>
                Showing {filtered.length} of {all.length} bookings
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
