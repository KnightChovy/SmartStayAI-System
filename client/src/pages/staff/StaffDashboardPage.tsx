import { useMemo, type ComponentType } from 'react';
import { Link, useNavigate } from 'react-router';
import { LogIn, LogOut, BedDouble, Clock, ArrowRight } from 'lucide-react';
import { useHotelBookings } from '@/hooks/staff';
import { useStaffHotelStore } from '@/stores/staffHotelStore';
import { BookingStatusBadge } from '@/components/staff/StatusBadge';
import { DataTable, type Column } from '@/components/hotel-partner/shared/DataTable';
import { TableSkeleton } from '@/components/shared/skeletons';
import { Skeleton } from '@/components/ui/skeleton';
import { ChartCard, ChartEmpty } from '@/components/staff/dashboard/ChartCard';
import { RevenueBookingsChart } from '@/components/staff/dashboard/RevenueBookingsChart';
import { BookingStatusDonut } from '@/components/staff/dashboard/BookingStatusDonut';
import { BookingsByRoomTypeChart } from '@/components/staff/dashboard/BookingsByRoomTypeChart';
import {
  buildDailySeries,
  buildStatusSlices,
  buildRoomTypeBars,
} from '@/components/staff/dashboard/helpers';
import type { HotelBooking } from '@/types/staff.types';
import { ROUTES } from '@/constants/routes';
import { formatDate } from '@/utils/formatDate';

/** Same day (compares the date part, ignoring time). */
function isSameDay(iso: string, ref: Date): boolean {
  const d = new Date(iso);
  return (
    d.getUTCFullYear() === ref.getUTCFullYear() &&
    d.getUTCMonth() === ref.getUTCMonth() &&
    d.getUTCDate() === ref.getUTCDate()
  );
}

interface StatCardProps {
  label: string;
  value: number;
  icon: ComponentType<{ className?: string }>;
  tone: string;
  loading?: boolean;
}

function StatCard({ label, value, icon: Icon, tone, loading }: StatCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className={`mb-3 flex size-9 items-center justify-center rounded-lg ${tone}`}>
        <Icon className="size-5" />
      </div>
      {loading ? (
        <Skeleton className="h-8 w-10" />
      ) : (
        <p className="text-2xl font-bold text-slate-900">{value}</p>
      )}
      <p className="mt-0.5 text-xs text-slate-500">{label}</p>
    </div>
  );
}

const columns: Column<HotelBooking>[] = [
  {
    id: 'guest',
    header: 'Guest',
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
    className: 'hidden sm:table-cell',
    cell: b => <span className="text-slate-600">{b.roomType.name}</span>,
  },
  {
    id: 'dates',
    header: 'Check-in → Check-out',
    className: 'hidden md:table-cell',
    cell: b => (
      <span className="text-slate-600">
        {formatDate(b.checkInDate)} → {formatDate(b.checkOutDate)}
      </span>
    ),
  },
  {
    id: 'status',
    header: 'Status',
    align: 'right',
    cell: b => <BookingStatusBadge status={b.status} />,
  },
];

export default function StaffDashboardPage() {
  const hotel = useStaffHotelStore(state => state.hotel);
  const { data, isLoading, isError } = useHotelBookings(hotel?.id, { limit: 100 });

  const bookings: HotelBooking[] = data?.results ?? [];
  const today = new Date();

  const arrivals = bookings.filter(
    b => b.status === 'confirmed' && isSameDay(b.checkInDate, today)
  );
  const departures = bookings.filter(
    b => b.status === 'checked_in' && isSameDay(b.checkOutDate, today)
  );
  const inHouse = bookings.filter(b => b.status === 'checked_in');
  const pendingPayment = bookings.filter(b => b.status === 'pending');

  const dailySeries = useMemo(() => buildDailySeries(bookings, 14), [bookings]);
  const statusSlices = useMemo(() => buildStatusSlices(bookings), [bookings]);
  const roomTypeBars = useMemo(() => buildRoomTypeBars(bookings), [bookings]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-bold text-slate-900">Today's overview</h1>
        <p className="text-sm text-slate-500">{hotel?.name}</p>
      </div>

      {isError && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          Could not load booking data. You may not be assigned to this hotel — click “Change” in
          the top bar to select another one.
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Arrivals today" value={arrivals.length} icon={LogIn} tone="bg-blue-100 text-blue-700" loading={isLoading} />
        <StatCard label="Departures" value={departures.length} icon={LogOut} tone="bg-amber-100 text-amber-700" loading={isLoading} />
        <StatCard label="In-house" value={inHouse.length} icon={BedDouble} tone="bg-emerald-100 text-emerald-700" loading={isLoading} />
        <StatCard label="Awaiting payment" value={pendingPayment.length} icon={Clock} tone="bg-rose-100 text-rose-700" loading={isLoading} />
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-3">
        <ChartCard
          title="Revenue & bookings"
          subtitle="Last 14 days"
          className="lg:col-span-3"
        >
          {isLoading ? (
            <Skeleton className="h-70 w-full" />
          ) : (
            <RevenueBookingsChart data={dailySeries} />
          )}
        </ChartCard>

        <ChartCard title="Booking status" subtitle="Current mix">
          {isLoading ? (
            <Skeleton className="h-65 w-full" />
          ) : statusSlices.length === 0 ? (
            <ChartEmpty />
          ) : (
            <BookingStatusDonut data={statusSlices} />
          )}
        </ChartCard>

        <ChartCard title="Bookings by room type" subtitle="All bookings" className="lg:col-span-2">
          {isLoading ? (
            <Skeleton className="h-65 w-full" />
          ) : roomTypeBars.length === 0 ? (
            <ChartEmpty />
          ) : (
            <BookingsByRoomTypeChart data={roomTypeBars} />
          )}
        </ChartCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <BookingSection
          title="Arrivals today"
          items={arrivals}
          empty="No arrivals today."
          loading={isLoading}
        />
        <BookingSection
          title="Departures today"
          items={departures}
          empty="No departures today."
          loading={isLoading}
        />
      </div>
    </div>
  );
}

function BookingSection({
  title,
  items,
  empty,
  loading,
}: {
  title: string;
  items: HotelBooking[];
  empty: string;
  loading?: boolean;
}) {
  const navigate = useNavigate();
  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">{title}</h2>
          <p className="text-sm text-slate-500">
            {loading ? 'Loading…' : `${items.length} booking${items.length === 1 ? '' : 's'}`}
          </p>
        </div>
        <Link
          to={ROUTES.staffFrontDesk}
          className="flex shrink-0 items-center gap-1 text-xs font-semibold text-primary hover:underline"
        >
          Front desk <ArrowRight className="size-3.5" />
        </Link>
      </div>

      {loading ? (
        <TableSkeleton columns={4} rows={3} />
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-400">
          {empty}
        </div>
      ) : (
        <DataTable
          columns={columns}
          rows={items}
          rowKey={b => b.id}
          minWidthClass="min-w-[320px]"
          onRowClick={b => navigate(ROUTES.staffBookingDetail(b.id))}
        />
      )}
    </section>
  );
}
