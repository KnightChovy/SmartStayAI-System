import { useMemo, useState, type ComponentType } from 'react';
import { Link, useNavigate } from 'react-router';
import { LogIn, LogOut, BedDouble, Clock, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/cn';
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
  /** Front desk filter this KPI drills into. */
  to: string;
  loading?: boolean;
}

/** KPI tile — always a link, so the number and the list behind it can't drift apart. */
function StatCard({ label, value, icon: Icon, tone, to, loading }: StatCardProps) {
  return (
    <Link
      to={to}
      className="group cursor-pointer rounded-xl border border-slate-200 bg-white p-4 transition-colors hover:border-slate-300 hover:bg-slate-50"
    >
      <div className={`mb-3 flex size-9 items-center justify-center rounded-lg ${tone}`}>
        <Icon className="size-5" />
      </div>
      {loading ? (
        <Skeleton className="h-8 w-10" />
      ) : (
        <p className="text-2xl font-bold text-slate-900">{value}</p>
      )}
      <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
        {label}
        <ArrowRight className="size-3 opacity-0 transition-opacity group-hover:opacity-100" />
      </p>
    </Link>
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
    header: <span className="whitespace-nowrap">Check-in → Check-out</span>,
    className: 'hidden md:table-cell whitespace-nowrap',
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
    className: 'whitespace-nowrap',
    cell: b => <BookingStatusBadge status={b.status} />,
  },
];

const RANGE_OPTIONS = [7, 14, 30] as const;

export default function StaffDashboardPage() {
  const hotel = useStaffHotelStore(state => state.hotel);
  const [rangeDays, setRangeDays] = useState<number>(14);
  const { data, isLoading, isError } = useHotelBookings(hotel?.id, { limit: 100 });

  const bookings: HotelBooking[] = useMemo(() => data?.results ?? [], [data]);
  const today = new Date();

  const arrivals = bookings.filter(
    b => b.status === 'confirmed' && isSameDay(b.checkInDate, today)
  );
  const departures = bookings.filter(
    b => b.status === 'checked_in' && isSameDay(b.checkOutDate, today)
  );
  const inHouse = bookings.filter(b => b.status === 'checked_in');
  const pendingPayment = bookings.filter(b => b.status === 'pending');

  const dailySeries = useMemo(
    () => buildDailySeries(bookings, rangeDays),
    [bookings, rangeDays]
  );
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
        <StatCard
          label="Arrivals today"
          value={arrivals.length}
          icon={LogIn}
          tone="bg-blue-100 text-blue-700"
          to={`${ROUTES.staffFrontDesk}?bucket=checkin`}
          loading={isLoading}
        />
        <StatCard
          label="Departures"
          value={departures.length}
          icon={LogOut}
          tone="bg-amber-100 text-amber-700"
          to={`${ROUTES.staffFrontDesk}?bucket=departure`}
          loading={isLoading}
        />
        <StatCard
          label="In-house"
          value={inHouse.length}
          icon={BedDouble}
          tone="bg-emerald-100 text-emerald-700"
          to={`${ROUTES.staffFrontDesk}?bucket=inhouse`}
          loading={isLoading}
        />
        <StatCard
          label="Awaiting payment"
          value={pendingPayment.length}
          icon={Clock}
          tone="bg-rose-100 text-rose-700"
          to={`${ROUTES.staffFrontDesk}?bucket=pending`}
          loading={isLoading}
        />
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-3">
        <ChartCard
          title="Revenue & bookings"
          subtitle={`Last ${rangeDays} days · bars = revenue (left axis), line = bookings (right axis)`}
          className="lg:col-span-3"
          action={
            <div className="flex shrink-0 gap-1 rounded-lg bg-slate-100 p-0.5">
              {RANGE_OPTIONS.map(days => (
                <button
                  key={days}
                  type="button"
                  onClick={() => setRangeDays(days)}
                  className={cn(
                    'rounded-md px-2 py-1 text-xs font-medium transition-colors',
                    rangeDays === days
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  )}
                >
                  {days}d
                </button>
              ))}
            </div>
          }
        >
          {isLoading ? (
            <Skeleton className="h-70 w-full" />
          ) : dailySeries.every(d => d.revenue === 0 && d.bookings === 0) ? (
            <ChartEmpty height={280} />
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
