import { useState, type ReactNode } from 'react';
import { Link, useParams, useLocation, useNavigate } from 'react-router';
import { toast } from 'sonner';
import {
  ArrowLeft,
  LogIn,
  LogOut,
  Loader2,
  Banknote,
  UserX,
  CalendarClock,
  AlertTriangle,
  BedDouble,
  Ticket,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';
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
import { CheckInConfirmModal } from '@/components/staff/CheckInConfirmModal';
import { ConfirmDialog } from '@/components/hotel-partner/shared/ConfirmDialog';
import { ROUTES } from '@/constants/routes';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate, toUtcDateKey, todayUtcKey } from '@/utils/formatDate';
import { errorMessage } from '@/utils/errorMessage';
import {
  bookingMoment,
  checkInBlockMessage,
  getCheckInBlockReason,
} from '@/utils/checkInWindow';
import {
  LATE_CHECKOUT_REASON_MAX,
  VOUCHER_CODE_MAX,
  lateCheckoutReasonSchema,
  optionalVoucherCodeSchema,
} from '@/validations/staff-booking.validation';

interface CheckInNavState {
  autoCheckIn?: boolean;
  voucherCode?: string;
}

export default function BookingDetailPage() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const navState = (location.state as CheckInNavState | null) ?? {};
  // Đến từ luồng quét QR → tự mở modal xác nhận check-in.
  const [showCheckInConfirm, setShowCheckInConfirm] = useState(!!navState.autoCheckIn);
  // Giữ mã đã quét trong state riêng: khi Cancel ta xoá `location.state` (xem `dismissCheckInConfirm`)
  // nên đọc thẳng `navState.voucherCode` sẽ mất mã ngay sau đó.
  const [scanVoucher] = useState(navState.voucherCode ?? '');

  /**
   * Đóng modal xác nhận check-in mà KHÔNG check-in.
   * Phải xoá luôn `location.state`: cờ `autoCheckIn` nằm trong history entry, nên nếu chỉ set state
   * thì F5 hoặc bấm Back/Forward là modal bật lại — lễ tân đã bấm Cancel mà máy vẫn mời check-in.
   */
  const dismissCheckInConfirm = () => {
    setShowCheckInConfirm(false);
    if (navState.autoCheckIn) {
      navigate(location.pathname, { replace: true, state: null });
    }
  };
  const hotel = useStaffHotelStore(state => state.hotel);
  const { data: booking, isLoading, isError } = useHotelBooking(hotel?.id, bookingId);
  const { data: rooms } = useHotelRooms(hotel?.id);

  const checkIn = useCheckIn(hotel?.id);
  const checkOut = useCheckOut(hotel?.id);
  const recordCash = useRecordCashPayment(hotel?.id);
  const noShow = useMarkNoShow(hotel?.id);

  const [roomId, setRoomId] = useState('');
  const [voucherCode, setVoucherCode] = useState('');
  const [lateCheckoutReason, setLateCheckoutReason] = useState('');
  const [confirmNoShow, setConfirmNoShow] = useState(false);
  const [confirmLateCheckout, setConfirmLateCheckout] = useState(false);

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

  const today = todayUtcKey();
  const checkOutKey = toUtcDateKey(booking.checkOutDate);
  const checkInTime = hotel?.checkInTime ?? '14:00';
  const checkOutTime = hotel?.checkOutTime ?? '12:00';
  const afterWindow = today >= checkOutKey;
  const afterCheckOutTime = new Date() > bookingMoment(booking.checkOutDate, checkOutTime);
  // Cửa sổ check-in xét bằng helper dùng chung (mirror guard của BE), nên bao gồm CẢ ca quá kỳ lưu
  // trú — trước đây chỉ chặn "chưa tới giờ" nên đơn đã hết hạn vẫn mời Confirm rồi ăn 400.
  const checkInBlock = getCheckInBlockReason(booking, checkInTime);
  const checkInLocked = checkInBlock !== null;
  const checkInBlockText = checkInBlock
    ? checkInBlockMessage(checkInBlock, booking, checkInTime)
    : null;

  // Available rooms of the right type for the receptionist to assign (empty = let BE auto-assign).
  const availableRooms = (rooms ?? []).filter(
    r => r.roomTypeId === booking.roomTypeId && r.status === 'available'
  );

  const assignedRooms = booking.bookingRooms
    .map(r => r.room?.roomNumber ?? r.roomId.slice(0, 6))
    .join(', ');

  /** Runs a front-desk action and reports the outcome. BE messages surface verbatim on failure. */
  const run = async (action: () => Promise<unknown>, okMsg: string, fallbackErr: string) => {
    try {
      await action();
      toast.success(okMsg);
    } catch (err) {
      toast.error(errorMessage(err, fallbackErr));
    }
  };

  const busy =
    checkIn.isPending || checkOut.isPending || recordCash.isPending || noShow.isPending;

  const completeCheckOut = () =>
    run(
      () =>
        checkOut.mutateAsync({
          bookingId: booking.id,
          payload: {},
        }),
      afterCheckOutTime ? 'Late check-out recorded successfully.' : 'Guest checked out successfully.',
      'Check-out failed.'
    );

  // Mã voucher dùng để redeem: ưu tiên mã lễ tân gõ tay, sau đó là mã vừa quét từ QR.
  const effectiveVoucher = voucherCode.trim() || scanVoucher;

  /**
   * Check-in THẬT — chỉ chạy từ nút Confirm của `CheckInConfirmModal`.
   * Mọi đường vào (quét QR hoặc bấm Check-in ở panel) đều phải đi qua modal này: check-in không
   * hoàn tác được, mà phòng thì bị gán ngay trong cùng transaction ở BE.
   */
  const handleConfirmCheckIn = async () => {
    await run(
      () =>
        checkIn.mutateAsync({
          bookingId: booking.id,
          payload: {
            ...(roomId ? { roomId } : {}),
            ...(effectiveVoucher ? { voucherCode: effectiveVoucher } : {}),
          },
        }),
      'Guest checked in successfully.',
      'Check-in failed.'
    );
    dismissCheckInConfirm();
  };

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

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Information */}
        <div className="space-y-4 lg:col-span-2">
          <Card title="Stay details">
            <Row label="Room type" value={booking.roomType.name} />
            <Row label="Guests" value={`${booking.numGuests} guest(s)`} />
            <Row
              label="Check-in → Check-out"
              value={`${formatDate(booking.checkInDate)} ${checkInTime} → ${formatDate(booking.checkOutDate)} ${checkOutTime} (${booking.numNights} night(s))`}
            />
            {assignedRooms && <Row label="Assigned rooms" value={assignedRooms} />}
            {booking.specialRequests && (
              <Row label="Special requests" value={booking.specialRequests} />
            )}
          </Card>

          <Card title="Customer">
            <Row label="Email" value={booking.customer.email} />
            <Row label="Phone" value={booking.customer.phone} />
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
                {checkInBlockText && (
                  <div
                    className={cn(
                      'flex items-start gap-2 rounded-lg p-2.5 text-xs',
                      // Quá kỳ lưu trú là ngõ cụt (phải xử lý no-show) → đỏ; chờ tới giờ thì chỉ là
                      // "quay lại sau" → vàng.
                      checkInBlock === 'stay_ended'
                        ? 'bg-rose-50 text-rose-700'
                        : 'bg-amber-50 text-amber-700'
                    )}
                  >
                    {checkInBlock === 'stay_ended' ? (
                      <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
                    ) : (
                      <CalendarClock className="mt-0.5 size-3.5 shrink-0" />
                    )}
                    {checkInBlockText}
                  </div>
                )}
                {!checkInLocked && (
                  <p className="rounded-lg bg-slate-50 p-2.5 text-xs text-slate-600">
                    Check-in is allowed from {checkInTime} on{' '}
                    {formatDate(booking.checkInDate)}.
                  </p>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="room" className="flex items-center gap-1 text-xs text-slate-500">
                    <BedDouble className="size-3.5" /> Assign room
                  </Label>
                  <select
                    id="room"
                    value={roomId}
                    onChange={e => setRoomId(e.target.value)}
                    disabled={checkInLocked}
                    title={
                      roomId
                        ? availableRooms.find(r => r.id === roomId)?.roomNumber
                        : 'Auto-assign an available room of this type'
                    }
                    className="h-9 w-full truncate rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:border-slate-400 focus:outline-none disabled:bg-slate-50"
                  >
                    <option value="">Auto-assign a room</option>
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
                  {/* Trần 50 khớp Joi `checkInBooking` của BE — chặn ngay tại ô nhập thay vì để
                      lễ tân bấm Check-in trước mặt khách rồi mới nhận 400. */}
                  <Input
                    id="voucher"
                    value={voucherCode}
                    maxLength={VOUCHER_CODE_MAX}
                    onChange={e => setVoucherCode(e.target.value)}
                    placeholder="VC…"
                  />
                </div>

                <Button
                  className="w-full bg-emerald-600 text-white hover:bg-emerald-700"
                  disabled={busy || checkInLocked}
                  title={checkInBlockText ?? undefined}
                  onClick={() => {
                    const parsed = optionalVoucherCodeSchema.safeParse(voucherCode);
                    if (!parsed.success) {
                      toast.error(parsed.error.issues[0].message);
                      return;
                    }
                    // Mở modal xác nhận thay vì check-in ngay: thao tác này không hoàn tác được.
                    setShowCheckInConfirm(true);
                  }}
                >
                  {checkIn.isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <LogIn className="size-4" />
                  )}
                  Check-in
                </Button>
              </div>
            )}

            {booking.status === 'checked_in' && (
              <div className="mb-3 space-y-2">
                <p
                  className={
                    afterCheckOutTime
                      ? 'rounded-lg bg-rose-50 p-2.5 text-xs text-rose-700'
                      : 'rounded-lg bg-amber-50 p-2.5 text-xs text-amber-700'
                  }
                >
                  {afterCheckOutTime
                    ? `Late check-out: the ${checkOutTime} deadline has passed. Enter the reason, then confirm checkout.`
                    : `Check-out deadline: ${checkOutTime} on ${formatDate(booking.checkOutDate)}.`}
                </p>
                {afterCheckOutTime && (
                  <div className="space-y-1.5">
                    <Label htmlFor="late-checkout-reason" className="text-xs text-slate-500">
                      Reason for late check-out
                    </Label>
                    <Input
                      id="late-checkout-reason"
                      value={lateCheckoutReason}
                      maxLength={LATE_CHECKOUT_REASON_MAX}
                      onChange={e => setLateCheckoutReason(e.target.value)}
                      placeholder="e.g. Guest requested a late departure"
                    />
                  </div>
                )}
                <Button
                  className="w-full"
                  disabled={busy}
                  onClick={() => {
                    if (!afterCheckOutTime) {
                      completeCheckOut();
                      return;
                    }
                    const parsed = lateCheckoutReasonSchema.safeParse(lateCheckoutReason);
                    if (!parsed.success) {
                      toast.error(parsed.error.issues[0].message);
                      return;
                    }
                    setConfirmLateCheckout(true);
                  }}
                >
                  <LogOut className="size-4" /> {afterCheckOutTime ? 'Confirm late check-out' : 'Check-out'}
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
              // Secondary, destructive-tinted: no-show releases the room and can't be undone here,
              // so it must not compete with Check-in for attention.
              <Button
                variant="outline"
                className="w-full border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                disabled={busy}
                onClick={() => setConfirmNoShow(true)}
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

      <ConfirmDialog
        open={confirmNoShow}
        onClose={() => setConfirmNoShow(false)}
        onConfirm={async () => {
          await run(
            () => noShow.mutateAsync({ bookingId: booking.id }),
            'Marked as no-show.',
            'Failed to mark as no-show.'
          );
          setConfirmNoShow(false);
        }}
        loading={noShow.isPending}
        destructive
        title="Mark as no-show?"
        confirmLabel="Mark as no-show"
        message={`${booking.customer.fullName} (${booking.bookingCode}) will be marked as a no-show and the held room released. This cannot be undone from the front desk.`}
      />

      <ConfirmDialog
        open={confirmLateCheckout}
        onClose={() => setConfirmLateCheckout(false)}
        onConfirm={async () => {
          await completeCheckOut();
          setConfirmLateCheckout(false);
        }}
        loading={checkOut.isPending}
        title="Confirm late check-out?"
        confirmLabel="Complete late check-out"
        message={`Reason: ${lateCheckoutReason.trim()}. Confirm the actual departure before freeing the room for housekeeping.`}
      />

      {booking.status === 'confirmed' && (
        <CheckInConfirmModal
          open={showCheckInConfirm}
          onClose={dismissCheckInConfirm}
          onConfirm={handleConfirmCheckIn}
          isPending={checkIn.isPending}
          disabled={checkInLocked}
          guestName={booking.customer.fullName}
          bookingCode={booking.bookingCode}
          roomTypeName={booking.roomType.name}
          checkInDate={booking.checkInDate}
          checkOutDate={booking.checkOutDate}
          numNights={booking.numNights}
          voucherCode={effectiveVoucher || booking.voucher?.voucherCode}
          roomNumber={availableRooms.find(r => r.id === roomId)?.roomNumber}
          warning={checkInBlockText}
          blocking={checkInBlock === 'stay_ended'}
        />
      )}
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

/** Empty values read as "Not provided" rather than a bare dash, which looks like a bug. */
function Row({ label, value }: { label: string; value: string | null | undefined }) {
  const empty = value == null || value.trim() === '';
  return (
    <div className="flex justify-between gap-4 py-1 text-sm">
      <span className="text-slate-500">{label}</span>
      <span
        className={
          empty ? 'text-right text-slate-400 italic' : 'text-right font-medium text-slate-900'
        }
      >
        {empty ? 'Not provided' : value}
      </span>
    </div>
  );
}
