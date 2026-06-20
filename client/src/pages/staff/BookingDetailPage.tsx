import { useState, type ReactNode } from 'react';
import { Link, useParams } from 'react-router';
import {
  ArrowLeft,
  LogIn,
  LogOut,
  Banknote,
  UserX,
  CheckCircle2,
  AlertCircle,
  CalendarClock,
  BedDouble,
  Ticket,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  useHotelBooking,
  useHotelRooms,
  useCheckIn,
  useCheckOut,
  useRecordCashPayment,
  useMarkNoShow,
} from '@/hooks/staff';
import { useStaffHotelStore } from '@/stores/staffHotelStore';
import { BookingStatusBadge, PaymentStatusBadge } from '@/components/staff/StatusBadge';
import { ROUTES } from '@/constants/routes';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDateShort, toUtcDateKey, todayUtcKey } from '@/utils/formatDate';
import { errorMessage } from '@/utils/errorMessage';

export default function BookingDetailPage() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const hotel = useStaffHotelStore(state => state.hotel);
  const { data: booking, isLoading, isError } = useHotelBooking(hotel?.id, bookingId);
  const { data: rooms } = useHotelRooms(hotel?.id);

  const checkIn = useCheckIn(hotel?.id);
  const checkOut = useCheckOut(hotel?.id);
  const recordCash = useRecordCashPayment(hotel?.id);
  const noShow = useMarkNoShow(hotel?.id);

  const [roomId, setRoomId] = useState('');
  const [voucherCode, setVoucherCode] = useState('');
  const [extraCharge, setExtraCharge] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; msg: string } | null>(null);

  if (isLoading) return <p className="text-sm text-slate-500">Loading booking…</p>;
  if (isError || !booking)
    return (
      <div className="space-y-3">
        <BackLink />
        <p className="text-sm text-rose-600">Could not load booking (you may not have permission).</p>
      </div>
    );

  const pendingCashPayment = booking.payments.find(
    p => p.paymentMethod === 'cash' && p.status === 'pending'
  );

  // Actual check-in window: check-in date ≤ today < check-out date.
  const today = todayUtcKey();
  const checkInKey = toUtcDateKey(booking.checkInDate);
  const checkOutKey = toUtcDateKey(booking.checkOutDate);
  const beforeWindow = today < checkInKey;
  const afterWindow = today >= checkOutKey;

  // Available rooms of the right type for the receptionist to assign (empty = let BE auto-assign).
  const availableRooms = (rooms ?? []).filter(
    r => r.roomTypeId === booking.roomTypeId && r.status === 'available'
  );

  const assignedRooms = booking.bookingRooms
    .map(r => r.room?.roomNumber ?? r.roomId.slice(0, 6))
    .join(', ');

  const run = async (action: () => Promise<unknown>, okMsg: string, fallbackErr: string) => {
    setFeedback(null);
    try {
      await action();
      setFeedback({ type: 'ok', msg: okMsg });
    } catch (err) {
      setFeedback({ type: 'err', msg: errorMessage(err, fallbackErr) });
    }
  };

  const busy =
    checkIn.isPending || checkOut.isPending || recordCash.isPending || noShow.isPending;

  return (
    <div className="space-y-5">
      <BackLink />

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">{booking.customer.fullName}</h1>
          <p className="font-mono text-sm text-slate-400">{booking.bookingCode}</p>
        </div>
        <BookingStatusBadge status={booking.status} className="px-3 py-1 text-sm" />
      </div>

      {feedback && (
        <div
          className={`flex items-center gap-2 rounded-lg border p-3 text-sm ${
            feedback.type === 'ok'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-rose-200 bg-rose-50 text-rose-700'
          }`}
        >
          {feedback.type === 'ok' ? (
            <CheckCircle2 className="size-4" />
          ) : (
            <AlertCircle className="size-4" />
          )}
          {feedback.msg}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Information */}
        <div className="space-y-4 lg:col-span-2">
          <Card title="Stay details">
            <Row label="Room type" value={booking.roomType.name} />
            <Row label="Guests" value={`${booking.numGuests} guest(s)`} />
            <Row
              label="Check-in → Check-out"
              value={`${formatDateShort(booking.checkInDate)} → ${formatDateShort(booking.checkOutDate)} (${booking.numNights} night(s))`}
            />
            {assignedRooms && <Row label="Assigned rooms" value={assignedRooms} />}
            {booking.specialRequests && (
              <Row label="Special requests" value={booking.specialRequests} />
            )}
          </Card>

          <Card title="Customer">
            <Row label="Email" value={booking.customer.email} />
            <Row label="Phone" value={booking.customer.phone ?? '—'} />
          </Card>

          {booking.voucher && (
            <Card title="Voucher">
              <div className="flex items-center justify-between py-1 text-sm">
                <span className="inline-flex items-center gap-1.5 font-mono text-slate-700">
                  <Ticket className="size-4 text-slate-400" />
                  {booking.voucher.voucherCode}
                </span>
                <span
                  className={
                    booking.voucher.usedAt ? 'text-xs text-slate-400' : 'text-xs text-emerald-600'
                  }
                >
                  {booking.voucher.usedAt ? 'Used' : 'Not used'}
                </span>
              </div>
            </Card>
          )}

          <Card title="Payment">
            <Row label="Total amount" value={formatCurrency(booking.totalAmount)} />
            {booking.discountAmount !== '0' && (
              <Row label="Discount" value={`- ${formatCurrency(booking.discountAmount)}`} />
            )}
            <div className="pt-2">
              {booking.payments.length === 0 && (
                <p className="text-sm text-slate-400">No transactions yet.</p>
              )}
              {booking.payments.map(p => (
                <div key={p.id} className="flex items-center justify-between py-1 text-sm">
                  <span className="text-slate-600">
                    {p.paymentMethod === 'cash' ? 'Cash' : 'VNPay'} · {formatCurrency(p.amount)}
                  </span>
                  <PaymentStatusBadge status={p.status} />
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h2 className="mb-3 text-sm font-semibold text-slate-900">Front desk actions</h2>

            {booking.status === 'confirmed' && (
              <div className="mb-3 space-y-3">
                {beforeWindow && (
                  <div className="flex items-start gap-2 rounded-lg bg-amber-50 p-2.5 text-xs text-amber-700">
                    <CalendarClock className="mt-0.5 size-3.5 shrink-0" />
                    The check-in date ({formatDateShort(booking.checkInDate)}) has not arrived yet.
                    Check-in is not available.
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="room" className="flex items-center gap-1 text-xs text-slate-500">
                    <BedDouble className="size-3.5" /> Assign room
                  </Label>
                  <select
                    id="room"
                    value={roomId}
                    onChange={e => setRoomId(e.target.value)}
                    disabled={beforeWindow}
                    className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:border-slate-400 focus:outline-none disabled:bg-slate-50"
                  >
                    <option value="">Auto-select an available room</option>
                    {availableRooms.map(r => (
                      <option key={r.id} value={r.id}>
                        Room {r.roomNumber}
                        {r.floor ? ` · floor ${r.floor}` : ''}
                      </option>
                    ))}
                  </select>
                  {availableRooms.length === 0 && (
                    <p className="text-xs text-rose-500">No available rooms of this type.</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="voucher" className="text-xs text-slate-500">
                    Voucher code (optional)
                  </Label>
                  <Input
                    id="voucher"
                    value={voucherCode}
                    onChange={e => setVoucherCode(e.target.value)}
                    placeholder="VC…"
                  />
                </div>

                <Button
                  className="w-full"
                  disabled={busy || beforeWindow}
                  onClick={() =>
                    run(
                      () =>
                        checkIn.mutateAsync({
                          bookingId: booking.id,
                          payload: {
                            ...(roomId ? { roomId } : {}),
                            ...(voucherCode ? { voucherCode } : {}),
                          },
                        }),
                      'Guest checked in successfully.',
                      'Check-in failed.'
                    )
                  }
                >
                  <LogIn className="size-4" /> Check-in
                </Button>
              </div>
            )}

            {booking.status === 'checked_in' && (
              <div className="mb-3 space-y-2">
                <Label htmlFor="extra" className="text-xs text-slate-500">
                  Extra charge (if any)
                </Label>
                <Input
                  id="extra"
                  type="number"
                  min={0}
                  value={extraCharge}
                  onChange={e => setExtraCharge(e.target.value)}
                  placeholder="0"
                />
                <Button
                  className="w-full"
                  disabled={busy}
                  onClick={() =>
                    run(
                      () =>
                        checkOut.mutateAsync({
                          bookingId: booking.id,
                          payload: extraCharge ? { extraCharge: Number(extraCharge) } : {},
                        }),
                      'Guest checked out successfully.',
                      'Check-out failed.'
                    )
                  }
                >
                  <LogOut className="size-4" /> Check-out
                </Button>
              </div>
            )}

            {pendingCashPayment && (
              <Button
                variant="secondary"
                className="mb-2 w-full"
                disabled={busy}
                onClick={() =>
                  run(
                    () => recordCash.mutateAsync({ bookingId: booking.id }),
                    'Cash payment recorded.',
                    'Failed to record cash payment.'
                  )
                }
              >
                <Banknote className="size-4" /> Collect cash
              </Button>
            )}

            {booking.status === 'confirmed' && (
              <Button
                variant="destructive"
                className="w-full"
                disabled={busy}
                onClick={() =>
                  run(
                    () => noShow.mutateAsync({ bookingId: booking.id }),
                    'Marked as no-show.',
                    'Failed to mark as no-show.'
                  )
                }
              >
                <UserX className="size-4" /> Mark as no-show
              </Button>
            )}

            {['checked_out', 'cancelled', 'no_show'].includes(booking.status) && (
              <p className="text-sm text-slate-400">Booking has ended, no actions available.</p>
            )}
            {booking.status === 'pending' && !pendingCashPayment && (
              <p className="text-sm text-slate-400">
                Booking is awaiting online payment from the guest (VNPay).
              </p>
            )}
            {afterWindow && booking.status === 'confirmed' && (
              <p className="mt-2 text-xs text-rose-500">
                The stay period has passed — this should be handled as a no-show.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function BackLink() {
  return (
    <Link
      to={ROUTES.staffFrontDesk}
      className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900"
    >
      <ArrowLeft className="size-4" /> Front desk
    </Link>
  );
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <h2 className="mb-3 text-sm font-semibold text-slate-900">{title}</h2>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 py-1 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="text-right font-medium text-slate-900">{value}</span>
    </div>
  );
}
