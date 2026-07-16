import { useMemo, useState, type ComponentType, type ReactNode } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { toast } from 'sonner';
import {
  Search,
  ChevronRight,
  ChevronLeft,
  ChevronsUpDown,
  ArrowUp,
  ArrowDown,
  LogIn,
  LogOut,
  BedDouble,
  Clock,
  CalendarCheck,
  Loader2,
  QrCode,
  X,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/cn';
import { useHotelBookings, useCheckIn, useCheckOut } from '@/hooks/staff';
import { useStaffHotelStore } from '@/stores/staffHotelStore';
import { BookingStatusBadge } from '@/components/staff/StatusBadge';
import { QrCheckInModal } from '@/components/staff/QrCheckInModal';
import { CheckInConfirmModal } from '@/components/staff/CheckInConfirmModal';
import { TableSkeleton } from '@/components/shared/skeletons';
import type { HotelBooking } from '@/types/staff.types';
import { ROUTES } from '@/constants/routes';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate, toUtcDateKey, todayUtcKey } from '@/utils/formatDate';
import { errorMessage } from '@/utils/errorMessage';

const BUCKETS = [
  'all',
  'checkin',
  'confirmed',
  'departure',
  'inhouse',
  'pending',
] as const;
type Bucket = (typeof BUCKETS)[number];

const isBucket = (v: string | null): v is Bucket =>
  !!v && (BUCKETS as readonly string[]).includes(v);

/** Column the list can be ordered by. `createdAt` (newest first) is the default. */
type SortKey = 'createdAt' | 'checkInDate' | 'totalAmount' | 'status';
type SortDir = 'asc' | 'desc';

const PAGE_SIZE = 10;

/** Booking within the actual check-in window (check-in date ≤ today < check-out date). */
function canCheckIn(b: HotelBooking, today: string): boolean {
  return (
    b.status === 'confirmed' &&
    toUtcDateKey(b.checkInDate) <= today &&
    today < toUtcDateKey(b.checkOutDate)
  );
}

export default function FrontDeskPage() {
  const navigate = useNavigate();
  const hotel = useStaffHotelStore(state => state.hotel);
  // Bucket lives in the URL so the dashboard KPI cards and the bell can deep-link into a filter.
  const [params, setParams] = useSearchParams();
  const bucket: Bucket = isBucket(params.get('bucket'))
    ? (params.get('bucket') as Bucket)
    : 'checkin';
  const setBucket = (next: Bucket) => {
    const p = new URLSearchParams(params);
    p.set('bucket', next);
    setParams(p, { replace: true });
    setPage(1);
  };
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir }>({
    key: 'createdAt',
    dir: 'desc',
  });
  const [page, setPage] = useState(1);
  const [scanOpen, setScanOpen] = useState(false);
  // Booking pending confirmation for the inline check-in button.
  const [confirmTarget, setConfirmTarget] = useState<HotelBooking | null>(null);

  // Fetch all bookings, then bucket them client-side to show counts per task to do.
  const { data, isLoading, isError } = useHotelBookings(hotel?.id, {
    limit: 100,
  });
  const checkIn = useCheckIn(hotel?.id);
  const checkOut = useCheckOut(hotel?.id);
  const today = todayUtcKey();

  const all = useMemo(() => data?.results ?? [], [data]);

  const counts = useMemo(
    () => ({
      checkin: all.filter(b => canCheckIn(b, today)).length,
      confirmed: all.filter(b => b.status === 'confirmed').length,
      departure: all.filter(
        b => b.status === 'checked_in' && toUtcDateKey(b.checkOutDate) === today
      ).length,
      inhouse: all.filter(b => b.status === 'checked_in').length,
      pending: all.filter(b => b.status === 'pending').length,
    }),
    [all, today]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matchesQuery = (b: HotelBooking) =>
      !q ||
      b.bookingCode.toLowerCase().includes(q) ||
      b.customer.fullName.toLowerCase().includes(q) ||
      b.customer.email.toLowerCase().includes(q);

    const inBucket = (b: HotelBooking) => {
      switch (bucket) {
        case 'checkin':
          return canCheckIn(b, today);
        case 'confirmed':
          return b.status === 'confirmed';
        case 'departure':
          return (
            b.status === 'checked_in' && toUtcDateKey(b.checkOutDate) === today
          );
        case 'inhouse':
          return b.status === 'checked_in';
        case 'pending':
          return b.status === 'pending';
        default:
          return true;
      }
    };

    const compare = (a: HotelBooking, b: HotelBooking) => {
      switch (sort.key) {
        case 'totalAmount':
          return Number(a.totalAmount) - Number(b.totalAmount);
        case 'checkInDate':
          return a.checkInDate.localeCompare(b.checkInDate);
        case 'status':
          return a.status.localeCompare(b.status);
        default:
          return a.createdAt.localeCompare(b.createdAt);
      }
    };

    return all
      .filter(b => inBucket(b) && matchesQuery(b))
      .sort((a, b) => (sort.dir === 'asc' ? compare(a, b) : compare(b, a)));
  }, [all, bucket, query, today, sort]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const visible = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  // Changing what's listed sends the reader back to the first page.
  const toggleSort = (key: SortKey) => {
    setSort(s =>
      s.key === key
        ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' }
        : { key, dir: key === 'totalAmount' ? 'desc' : 'asc' }
    );
    setPage(1);
  };

  const changeQuery = (next: string) => {
    setQuery(next);
    setPage(1);
  };

  const busyId = checkIn.isPending
    ? checkIn.variables?.bookingId
    : checkOut.isPending
      ? checkOut.variables?.bookingId
      : undefined;

  // Check-in is irreversible from the front desk, so the inline button confirms first.
  const confirmQuickCheckIn = async () => {
    const b = confirmTarget;
    if (!b) return;
    try {
      await checkIn.mutateAsync({ bookingId: b.id, payload: {} });
      toast.success(`Checked in ${b.customer.fullName}. Room assigned automatically.`);
    } catch (err) {
      toast.error(errorMessage(err, 'Check-in failed.'));
    } finally {
      setConfirmTarget(null);
    }
  };

  const quickCheckOut = async (b: HotelBooking) => {
    try {
      await checkOut.mutateAsync({ bookingId: b.id, payload: {} });
      toast.success(`Checked out ${b.customer.fullName}.`);
    } catch (err) {
      toast.error(errorMessage(err, 'Check-out failed.'));
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Front desk</h1>
          <p className="text-sm text-slate-500">{hotel?.name}</p>
        </div>
        <button
          type="button"
          onClick={() => setScanOpen(true)}
          title="Scan the QR code on the guest's e-voucher to open their booking"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-xs font-medium text-white hover:bg-slate-800"
        >
          <QrCode className="size-3.5" /> Scan check-in
        </button>
      </div>

      <QrCheckInModal
        open={scanOpen}
        onClose={() => setScanOpen(false)}
        hotelId={hotel?.id}
        onFound={(bookingId, voucherCode) => {
          setScanOpen(false);
          navigate(ROUTES.staffBookingDetail(bookingId), {
            state: { autoCheckIn: true, voucherCode },
          });
        }}
      />

      {/* Filters by task to do */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <BucketTile
          active={bucket === 'checkin'}
          onClick={() => setBucket('checkin')}
          icon={LogIn}
          label="To check in"
          count={counts.checkin}
          tone="emerald"
        />
        <BucketTile
          active={bucket === 'confirmed'}
          onClick={() => setBucket('confirmed')}
          icon={CalendarCheck}
          label="Confirmed"
          count={counts.confirmed}
          tone="indigo"
        />
        <BucketTile
          active={bucket === 'departure'}
          onClick={() => setBucket('departure')}
          icon={LogOut}
          label="Departing today"
          count={counts.departure}
          tone="amber"
        />
        <BucketTile
          active={bucket === 'inhouse'}
          onClick={() => setBucket('inhouse')}
          icon={BedDouble}
          label="In-house"
          count={counts.inhouse}
          tone="sky"
        />
        <BucketTile
          active={bucket === 'pending'}
          onClick={() => setBucket('pending')}
          icon={Clock}
          label="Awaiting payment"
          count={counts.pending}
          tone="slate"
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full max-w-sm">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={query}
            onChange={e => changeQuery(e.target.value)}
            placeholder="Search booking code, guest name or email…"
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          {(bucket !== 'all' || query) && (
            <button
              onClick={() => {
                setBucket('all');
                changeQuery('');
              }}
              className="inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-900"
            >
              <X className="size-3" /> Clear filter
            </button>
          )}
          <button
            onClick={() => setBucket('all')}
            className={cn(
              'rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
              bucket === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'
            )}
          >
            View all bookings
          </button>
        </div>
      </div>

      {/* List */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        {isError && (
          <p className="px-4 py-10 text-center text-sm text-rose-600">
            Could not load bookings. You may not be assigned to this hotel.
          </p>
        )}
        {isLoading && <TableSkeleton columns={6} rows={5} className="border-0" />}
        {!isLoading && !isError && filtered.length === 0 && (
          <p className="px-4 py-10 text-center text-sm text-slate-400">
            {query
              ? `No bookings match “${query.trim()}”.`
              : 'No bookings in this category.'}
          </p>
        )}

        {!isLoading && !isError && filtered.length > 0 && (
          <table className="w-full text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-left text-xs text-slate-500">
              <tr>
                <th className="px-4 py-2.5 font-medium">Code / Guest</th>
                <th className="hidden px-4 py-2.5 font-medium md:table-cell">
                  Room type
                </th>
                <SortableHeader
                  label="Check-in → Check-out"
                  sortKey="checkInDate"
                  sort={sort}
                  onSort={toggleSort}
                  className="hidden sm:table-cell"
                />
                <SortableHeader
                  label="Total"
                  sortKey="totalAmount"
                  sort={sort}
                  onSort={toggleSort}
                />
                <SortableHeader
                  label="Status"
                  sortKey="status"
                  sort={sort}
                  onSort={toggleSort}
                />
                <th className="px-4 py-2.5 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visible.map(b => {
                const rowBusy = busyId === b.id;
                return (
                  <tr key={b.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <Link
                        to={ROUTES.staffBookingDetail(b.id)}
                        className="font-medium text-slate-900 hover:underline"
                      >
                        {b.customer.fullName}
                      </Link>
                      <p className="font-mono text-xs text-slate-400">
                        {b.bookingCode}
                      </p>
                    </td>
                    <td className="hidden px-4 py-3 text-slate-600 md:table-cell">
                      {b.roomType.name}
                    </td>
                    <td className="hidden px-4 py-3 whitespace-nowrap text-slate-600 sm:table-cell">
                      {formatDate(b.checkInDate)} → {formatDate(b.checkOutDate)}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {formatCurrency(b.totalAmount)}
                    </td>
                    <td className="px-4 py-3">
                      <BookingStatusBadge status={b.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {canCheckIn(b, today) && (
                          <QuickButton
                            busy={rowBusy}
                            onClick={() => setConfirmTarget(b)}
                            icon={LogIn}
                            label="Check-in"
                            tone="emerald"
                          />
                        )}
                        {b.status === 'checked_in' && (
                          <QuickButton
                            busy={rowBusy}
                            onClick={() => quickCheckOut(b)}
                            icon={LogOut}
                            label="Check-out"
                            tone="amber"
                          />
                        )}
                        <Link
                          to={ROUTES.staffBookingDetail(b.id)}
                          className="inline-flex items-center gap-0.5 text-xs font-medium text-slate-500 hover:text-slate-900"
                        >
                          Details <ChevronRight className="size-3" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {!isLoading && !isError && filtered.length > PAGE_SIZE && (
          <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-4 py-2.5">
            <p className="text-xs text-slate-500">
              {(currentPage - 1) * PAGE_SIZE + 1}–
              {Math.min(currentPage * PAGE_SIZE, filtered.length)} of{' '}
              {filtered.length} bookings
            </p>
            <div className="flex items-center gap-1">
              <PageButton
                disabled={currentPage === 1}
                onClick={() => setPage(currentPage - 1)}
                label="Previous page"
              >
                <ChevronLeft className="size-3.5" />
              </PageButton>
              <span className="px-2 text-xs font-medium text-slate-600 tabular-nums">
                {currentPage} / {pageCount}
              </span>
              <PageButton
                disabled={currentPage === pageCount}
                onClick={() => setPage(currentPage + 1)}
                label="Next page"
              >
                <ChevronRight className="size-3.5" />
              </PageButton>
            </div>
          </div>
        )}
      </div>

      {confirmTarget && (
        <CheckInConfirmModal
          open
          onClose={() => setConfirmTarget(null)}
          onConfirm={confirmQuickCheckIn}
          isPending={checkIn.isPending}
          guestName={confirmTarget.customer.fullName}
          bookingCode={confirmTarget.bookingCode}
          roomTypeName={confirmTarget.roomType.name}
          checkInDate={confirmTarget.checkInDate}
          checkOutDate={confirmTarget.checkOutDate}
          numNights={confirmTarget.numNights}
          voucherCode={confirmTarget.voucher?.voucherCode}
        />
      )}
    </div>
  );
}

function PageButton({
  disabled,
  onClick,
  label,
  children,
}: {
  disabled: boolean;
  onClick: () => void;
  label: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-label={label}
      className="inline-flex size-7 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent"
    >
      {children}
    </button>
  );
}

function SortableHeader({
  label,
  sortKey,
  sort,
  onSort,
  className,
}: {
  label: string;
  sortKey: SortKey;
  sort: { key: SortKey; dir: SortDir };
  onSort: (key: SortKey) => void;
  className?: string;
}) {
  const active = sort.key === sortKey;
  const Icon = !active ? ChevronsUpDown : sort.dir === 'asc' ? ArrowUp : ArrowDown;
  return (
    <th className={cn('px-4 py-2.5 font-medium', className)}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        aria-sort={active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}
        className={cn(
          'inline-flex items-center gap-1 whitespace-nowrap hover:text-slate-900',
          active && 'text-slate-900'
        )}
      >
        {label}
        <Icon className={cn('size-3', active ? 'text-slate-600' : 'text-slate-400')} />
      </button>
    </th>
  );
}

const TILE_TONES = {
  emerald:
    'data-[active=true]:border-emerald-400 data-[active=true]:bg-emerald-50 text-emerald-600',
  indigo:
    'data-[active=true]:border-indigo-400 data-[active=true]:bg-indigo-50 text-indigo-600',
  amber:
    'data-[active=true]:border-amber-400 data-[active=true]:bg-amber-50 text-amber-600',
  sky: 'data-[active=true]:border-sky-400 data-[active=true]:bg-sky-50 text-sky-600',
  slate:
    'data-[active=true]:border-slate-400 data-[active=true]:bg-slate-50 text-slate-600',
} as const;

function BucketTile({
  active,
  onClick,
  icon: Icon,
  label,
  count,
  tone,
}: {
  active: boolean;
  onClick: () => void;
  icon: ComponentType<{ className?: string }>;
  label: string;
  count: number;
  tone: keyof typeof TILE_TONES;
}) {
  return (
    <button
      data-active={active}
      onClick={onClick}
      className={cn(
        'flex flex-col gap-1 rounded-xl border border-slate-200 bg-white p-3 text-left transition-colors hover:bg-slate-50',
        TILE_TONES[tone]
      )}
    >
      <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
        <Icon className="size-3.5" /> {label}
      </div>
      <span className="text-2xl font-semibold text-slate-900">{count}</span>
    </button>
  );
}

const QUICK_TONES = {
  emerald: 'bg-emerald-600 hover:bg-emerald-700',
  amber: 'bg-amber-600 hover:bg-amber-700',
} as const;

function QuickButton({
  busy,
  onClick,
  icon: Icon,
  label,
  tone,
}: {
  busy: boolean;
  onClick: () => void;
  icon: ComponentType<{ className?: string }>;
  label: string;
  tone: keyof typeof QUICK_TONES;
}) {
  return (
    <button
      disabled={busy}
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium text-white transition-colors disabled:opacity-60',
        QUICK_TONES[tone]
      )}
    >
      {busy ? (
        <Loader2 className="size-3.5 animate-spin" />
      ) : (
        <Icon className="size-3.5" />
      )}
      {label}
    </button>
  );
}
