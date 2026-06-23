import { useMemo, useState } from 'react';
import { CalendarDays, Eye, Search } from 'lucide-react';
import AppFilter from '@/common/filter/AppFilter';
import AppPagination from '@/common/pagination/AppPagination';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoadingState, ErrorState, EmptyState } from '@/components/hotel-partner/shared/states';
import { DataTable, type Column } from '@/components/hotel-partner/shared/DataTable';
import { ActionMenu } from '@/components/hotel-partner/shared/ActionMenu';
import { Pill } from '@/components/hotel-partner/shared/Pill';
import { useHotelBookings } from '@/hooks/staff';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDateShort } from '@/utils/formatDate';
import type { BookingStatus, HotelBooking, HotelBookingsParams } from '@/types/staff.types';
import { BOOKING_STATUS_CONFIG, BOOKING_STATUS_OPTIONS } from './labels';
import { BookingDetailModal } from './BookingDetailModal';

interface BookingsTabProps {
  hotelId: string;
}

const PAGE_SIZE = 20;
const ALL = 'all';

/** Danh sách booking của MỘT khách sạn cho chủ KS — lọc trạng thái + xem chi tiết / vận hành. */
export function BookingsTab({ hotelId }: BookingsTabProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<BookingStatus | typeof ALL>(ALL);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [page, setPage] = useState(1);
  const [detailId, setDetailId] = useState<string | null>(null);

  const params: HotelBookingsParams = {
    page,
    limit: PAGE_SIZE,
    sortBy: 'createdAt:desc',
    status: statusFilter === ALL ? undefined : statusFilter,
    fromDate: fromDate || undefined,
    toDate: toDate || undefined,
  };
  const { data, isLoading, isError } = useHotelBookings(hotelId, params);

  const bookings = useMemo(() => data?.results ?? [], [data]);
  const totalPages = data?.totalPages ?? 1;

  // Tìm theo mã/khách áp client-side trên trang hiện tại (BE chưa hỗ trợ search).
  const q = search.trim().toLowerCase();
  const rows = q
    ? bookings.filter(
        b =>
          b.bookingCode.toLowerCase().includes(q) ||
          b.customer.fullName.toLowerCase().includes(q) ||
          b.customer.email.toLowerCase().includes(q)
      )
    : bookings;

  const hasServerFilter = statusFilter !== ALL || !!fromDate || !!toDate;

  const statusOptions = [
    { label: 'All statuses', value: ALL },
    ...BOOKING_STATUS_OPTIONS.map(o => ({ label: o.label, value: o.value })),
  ];

  const resetFilters = () => {
    setSearch('');
    setStatusFilter(ALL);
    setFromDate('');
    setToDate('');
    setPage(1);
  };

  const columns: Column<HotelBooking>[] = [
    {
      id: 'code',
      header: 'Code / Guest',
      cell: b => (
        <div className="min-w-0">
          <p className="font-semibold text-slate-900">{b.customer.fullName}</p>
          <p className="font-mono text-xs text-slate-400">{b.bookingCode}</p>
        </div>
      ),
    },
    {
      id: 'roomType',
      header: 'Room type',
      className: 'hidden md:table-cell',
      cell: b => <span className="text-slate-600">{b.roomType.name}</span>,
    },
    {
      id: 'dates',
      header: 'Check-in → Check-out',
      className: 'hidden sm:table-cell',
      cell: b => (
        <span className="text-slate-600">
          {formatDateShort(b.checkInDate)} → {formatDateShort(b.checkOutDate)}
        </span>
      ),
    },
    {
      id: 'total',
      header: 'Total',
      align: 'right',
      cell: b => <span className="font-medium text-slate-900">{formatCurrency(b.totalAmount)}</span>,
    },
    {
      id: 'status',
      header: 'Status',
      cell: b => {
        const cfg = BOOKING_STATUS_CONFIG[b.status];
        return <Pill className={cfg.class}>{cfg.label}</Pill>;
      },
    },
    {
      id: 'actions',
      header: '',
      align: 'right',
      cell: b => (
        <ActionMenu items={[{ label: 'View / manage', icon: Eye, onClick: () => setDetailId(b.id) }]} />
      ),
    },
  ];

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-lg font-bold text-slate-900">Bookings</h2>
        <p className="text-sm text-slate-500">
          {data ? `${data.totalResults} bookings` : 'Manage guest bookings for this hotel.'}
        </p>
      </div>

      <div className="mb-4 space-y-3">
        <AppFilter
          search={search}
          onSearchChange={setSearch}
          status={statusFilter}
          onStatusChange={v => {
            setPage(1);
            setStatusFilter(v as BookingStatus | typeof ALL);
          }}
          statusOptions={statusOptions}
          onReset={resetFilters}
        />
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <Label htmlFor="fromDate" className="text-xs text-slate-500">
              Check-in from
            </Label>
            <Input
              id="fromDate"
              type="date"
              value={fromDate}
              max={toDate || undefined}
              onChange={e => {
                setPage(1);
                setFromDate(e.target.value);
              }}
              className="w-44"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="toDate" className="text-xs text-slate-500">
              Check-in to
            </Label>
            <Input
              id="toDate"
              type="date"
              value={toDate}
              min={fromDate || undefined}
              onChange={e => {
                setPage(1);
                setToDate(e.target.value);
              }}
              className="w-44"
            />
          </div>
        </div>
      </div>

      {isLoading ? (
        <LoadingState label="Loading bookings..." />
      ) : isError ? (
        <ErrorState label="Failed to load the booking list." />
      ) : bookings.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title={hasServerFilter ? 'No bookings match this status' : 'No bookings yet'}
          description={
            hasServerFilter
              ? 'Try a different status filter.'
              : 'Bookings for this hotel will appear here.'
          }
        />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No bookings match your search"
          description={`Nothing on this page matches "${search}".`}
        />
      ) : (
        <>
          <DataTable
            columns={columns}
            rows={rows}
            rowKey={b => b.id}
            minWidthClass="min-w-[680px]"
            onRowClick={b => setDetailId(b.id)}
          />
          <div className="mt-4">
            <AppPagination
              currentPage={data?.page ?? page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </div>
        </>
      )}

      <BookingDetailModal
        open={!!detailId}
        onClose={() => setDetailId(null)}
        hotelId={hotelId}
        bookingId={detailId}
      />
    </div>
  );
}
