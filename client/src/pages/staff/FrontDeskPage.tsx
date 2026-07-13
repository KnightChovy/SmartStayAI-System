import { useMemo, useState, type ComponentType } from 'react';
import { Link, useNavigate } from 'react-router';
import {
  Search,
  ChevronRight,
  LogIn,
  LogOut,
  BedDouble,
  Clock,
  CalendarCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  QrCode,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/cn';
import { useHotelBookings, useCheckIn, useCheckOut } from '@/hooks/staff';
import { useStaffHotelStore } from '@/stores/staffHotelStore';
import { BookingStatusBadge } from '@/components/staff/StatusBadge';
import { QrCheckInModal } from '@/components/staff/QrCheckInModal';
import type { HotelBooking } from '@/types/staff.types';
import { ROUTES } from '@/constants/routes';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDateShort, toUtcDateKey, todayUtcKey } from '@/utils/formatDate';
import { errorMessage } from '@/utils/errorMessage';

type Bucket =
  | 'all'
  | 'checkin'
  | 'confirmed'
  | 'departure'
  | 'inhouse'
  | 'pending';

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
  const [bucket, setBucket] = useState<Bucket>('checkin');
  const [query, setQuery] = useState('');
  const [feedback, setFeedback] = useState<{
    type: 'ok' | 'err';
    msg: string;
  } | null>(null);
  const [scanOpen, setScanOpen] = useState(false);

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

    // Newest bookings first (by creation time).
    return all
      .filter(b => inBucket(b) && matchesQuery(b))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [all, bucket, query, today]);

  const busyId = checkIn.isPending
    ? checkIn.variables?.bookingId
    : checkOut.isPending
      ? checkOut.variables?.bookingId
      : undefined;

  const quickCheckIn = async (b: HotelBooking) => {
    setFeedback(null);
    try {
      await checkIn.mutateAsync({ bookingId: b.id, payload: {} });
      setFeedback({
        type: 'ok',
        msg: `Checked in ${b.customer.fullName}. Room assigned automatically.`,
      });
    } catch (err) {
      setFeedback({ type: 'err', msg: errorMessage(err, 'Check-in failed.') });
    }
  };

  const quickCheckOut = async (b: HotelBooking) => {
    setFeedback(null);
    try {
      await checkOut.mutateAsync({ bookingId: b.id, payload: {} });
      setFeedback({ type: 'ok', msg: `Checked out ${b.customer.fullName}.` });
    } catch (err) {
      setFeedback({ type: 'err', msg: errorMessage(err, 'Check-out failed.') });
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
            onChange={e => setQuery(e.target.value)}
            placeholder="Search booking code, guest name or email…"
            className="pl-9"
          />
        </div>
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

      {feedback && (
        <div
          className={cn(
            'flex items-center gap-2 rounded-lg border p-3 text-sm',
            feedback.type === 'ok'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-rose-200 bg-rose-50 text-rose-700'
          )}
        >
          {feedback.type === 'ok' ? (
            <CheckCircle2 className="size-4" />
          ) : (
            <AlertCircle className="size-4" />
          )}
          {feedback.msg}
        </div>
      )}

      {/* List */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        {isError && (
          <p className="px-4 py-10 text-center text-sm text-rose-600">
            Could not load bookings. You may not be assigned to this hotel.
          </p>
        )}
        {isLoading && (
          <p className="px-4 py-10 text-center text-sm text-slate-500">
            Loading…
          </p>
        )}
        {!isLoading && !isError && filtered.length === 0 && (
          <p className="px-4 py-10 text-center text-sm text-slate-400">
            No bookings in this category.
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
                <th className="hidden px-4 py-2.5 font-medium sm:table-cell">
                  Check-in → Check-out
                </th>
                <th className="px-4 py-2.5 font-medium">Total</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
                <th className="px-4 py-2.5 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(b => {
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
                    <td className="hidden px-4 py-3 text-slate-600 sm:table-cell">
                      {formatDateShort(b.checkInDate)} →{' '}
                      {formatDateShort(b.checkOutDate)}
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
                            onClick={() => quickCheckIn(b)}
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
      </div>
    </div>
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
