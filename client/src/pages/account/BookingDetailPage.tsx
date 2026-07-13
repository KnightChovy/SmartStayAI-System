import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Download,
  MapPin,
  PencilLine,
  Receipt,
  Users,
  XCircle,
} from 'lucide-react';
import { useBooking, useCancelBooking } from '@/hooks/bookings';
import { ROUTES } from '@/constants/routes';
import BookingStatusBadge from '@/components/shared/BookingStatusBadge';
import PriceSummary from '@/components/shared/PriceSummary';
import QRVoucher from '@/components/shared/QRVoucher';
import DateRangePicker from '@/components/shared/DateRangePicker';
import GuestSelector from '@/components/shared/GuestSelector';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { formatDateShort } from '@/utils/formatDate';
import { formatCurrency } from '@/utils/formatCurrency';

/** Trạng thái còn cho phép hủy / đổi. */
const CANCELLABLE = new Set(['pending', 'confirmed']);
/** Trạng thái còn cho phép yêu cầu hoàn tiền (đã thanh toán). */
const REFUNDABLE = new Set([
  'confirmed',
  'checked_in',
  'checked_out',
  'cancelled',
]);

export default function BookingDetailPage() {
  const { bookingId = '' } = useParams();
  const navigate = useNavigate();
  const { data: booking, isLoading } = useBooking(bookingId);
  const cancelBooking = useCancelBooking();

  const [showCancel, setShowCancel] = useState(false);
  const [reason, setReason] = useState('');

  // Mock (DB có Refund/Booking nhưng chưa có API) — xử lý dạng "gửi yêu cầu"
  const [showRefund, setShowRefund] = useState(false);
  const [refundReason, setRefundReason] = useState('');
  const [refundSent, setRefundSent] = useState(false);
  const [showModify, setShowModify] = useState(false);
  const [modifyRange, setModifyRange] = useState({ checkIn: '', checkOut: '' });
  const [modifyGuests, setModifyGuests] = useState(1);
  const [modifySent, setModifySent] = useState(false);

  if (isLoading) {
    return <Skeleton className="h-96 w-full rounded-3xl" />;
  }

  if (!booking) {
    return (
      <div className="rounded-2xl border border-outline-variant/30 bg-surface p-10 text-center">
        <p className="text-on-surface-variant">Booking not found.</p>
        <Button
          className="mt-4"
          variant="outline"
          onClick={() => navigate(ROUTES.accountBookings)}
        >
          Back to my bookings
        </Button>
      </div>
    );
  }

  const canCancel = CANCELLABLE.has(booking.status);
  const canModify = CANCELLABLE.has(booking.status);
  const canRefund = REFUNDABLE.has(booking.status);
  const canReview = booking.status === 'checked_out';

  const openModify = () => {
    setModifyRange({
      checkIn: booking.checkInDate.slice(0, 10),
      checkOut: booking.checkOutDate.slice(0, 10),
    });
    setModifyGuests(booking.numGuests);
    setModifySent(false);
    setShowModify(true);
  };

  /** Tải hóa đơn (mock): backend chưa có endpoint Invoice → in trang. */
  const downloadInvoice = () => window.print();

  const handleCancel = async () => {
    await cancelBooking.mutateAsync({
      bookingId: booking.id,
      reason: reason || undefined,
    });
    setShowCancel(false);
  };

  return (
    <div>
      <Link
        to={ROUTES.accountBookings}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-on-surface-variant hover:text-primary"
      >
        <ArrowLeft className="size-4" /> My bookings
      </Link>

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Main */}
        <div className="min-w-0 flex-1 space-y-6">
          <div className="rounded-2xl border border-outline-variant/30 bg-surface p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-be-vietnam text-2xl font-bold text-on-surface">
                {booking.hotel?.name ?? 'Hotel'}
              </h2>
              <BookingStatusBadge status={booking.status} />
            </div>
            <p className="mt-2 flex items-center gap-1.5 text-sm text-on-surface-variant">
              <MapPin className="size-4" />
              {[booking.hotel?.address, booking.hotel?.city]
                .filter(Boolean)
                .join(', ')}
            </p>

            <dl className="mt-5 grid gap-4 sm:grid-cols-2">
              <Detail label="Booking code" value={booking.bookingCode} />
              <Detail label="Room type" value={booking.roomType?.name ?? '—'} />
              <Detail
                label="Stay"
                value={`${formatDateShort(booking.checkInDate)} → ${formatDateShort(booking.checkOutDate)}`}
                icon={<CalendarDays className="size-4" />}
              />
              <Detail
                label="Guests"
                value={`${booking.numGuests} · ${booking.numNights} night${booking.numNights === 1 ? '' : 's'}`}
                icon={<Users className="size-4" />}
              />
            </dl>

            {booking.specialRequests && (
              <div className="mt-4 rounded-xl bg-surface-container-low p-3 text-sm">
                <span className="font-semibold text-on-surface">
                  Special requests:{' '}
                </span>
                <span className="text-on-surface-variant">
                  {booking.specialRequests}
                </span>
              </div>
            )}

            {booking.cancellationReason && (
              <div className="mt-4 rounded-xl bg-error/10 p-3 text-sm text-error">
                Cancelled: {booking.cancellationReason}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            {canModify && (
              <Button variant="outline" size="lg" onClick={openModify}>
                <PencilLine className="size-4" /> Modify
              </Button>
            )}
            {canRefund && (
              <Button
                variant="outline"
                size="lg"
                onClick={() => setShowRefund(true)}
              >
                <Receipt className="size-4" /> Request refund
              </Button>
            )}
            <Button variant="outline" size="lg" onClick={downloadInvoice}>
              <Download className="size-4" /> Invoice
            </Button>
            {canCancel && (
              <Button
                variant="destructive"
                size="lg"
                onClick={() => setShowCancel(true)}
              >
                <XCircle className="size-4" /> Cancel booking
              </Button>
            )}
            {canReview && (
              <Button
                asChild
                size="lg"
                className="bg-on-surface text-white hover:bg-primary"
              >
                <Link to={ROUTES.accountReviews}>Write a review</Link>
              </Button>
            )}
          </div>

          {/* Modify reservation (mock — gửi yêu cầu) */}
          {showModify && (
            <div className="rounded-2xl border border-outline-variant/30 bg-surface p-5">
              <h3 className="font-be-vietnam font-semibold text-on-surface">
                Modify reservation
              </h3>
              {modifySent ? (
                <p className="mt-3 flex items-center gap-2 rounded-xl bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700">
                  <CheckCircle2 className="size-4" /> Modification request sent.
                  The property will confirm availability shortly.
                </p>
              ) : (
                <>
                  <p className="mt-1 text-sm text-on-surface-variant">
                    Request new dates or guest count (subject to availability).
                  </p>
                  <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end">
                    <DateRangePicker
                      checkIn={modifyRange.checkIn}
                      checkOut={modifyRange.checkOut}
                      onChange={setModifyRange}
                      className="flex-1"
                    />
                    <GuestSelector
                      value={modifyGuests}
                      onChange={setModifyGuests}
                      className="sm:w-40"
                    />
                  </div>
                  <div className="mt-3 flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setShowModify(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      className="bg-on-surface text-white hover:bg-primary"
                      onClick={() => setModifySent(true)}
                    >
                      Send request
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Request refund (mock — gửi yêu cầu, DB có Refund) */}
          {showRefund && (
            <div className="rounded-2xl border border-outline-variant/30 bg-surface p-5">
              <h3 className="font-be-vietnam font-semibold text-on-surface">
                Request a refund
              </h3>
              {refundSent ? (
                <p className="mt-3 flex items-center gap-2 rounded-xl bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700">
                  <CheckCircle2 className="size-4" /> Refund request submitted
                  for {formatCurrency(booking.totalAmount)}. Our team will
                  review it within 3–5 business days.
                </p>
              ) : (
                <>
                  <p className="mt-1 text-sm text-on-surface-variant">
                    Refundable amount:{' '}
                    <strong>{formatCurrency(booking.totalAmount)}</strong>. Tell
                    us why you’re requesting a refund.
                  </p>
                  <textarea
                    rows={3}
                    value={refundReason}
                    onChange={e => setRefundReason(e.target.value)}
                    placeholder="Reason for refund…"
                    className="mt-3 w-full rounded-xl border border-outline-variant/40 bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
                  />
                  <div className="mt-3 flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setShowRefund(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      className="bg-on-surface text-white hover:bg-primary"
                      disabled={!refundReason.trim()}
                      onClick={() => setRefundSent(true)}
                    >
                      Submit request
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Cancel form */}
          {showCancel && (
            <div className="rounded-2xl border border-error/30 bg-error/5 p-5">
              <h3 className="font-semibold text-on-surface">
                Cancel this booking?
              </h3>
              <p className="mt-1 text-sm text-on-surface-variant">
                Tell us why you’re cancelling (optional). This action can’t be
                undone.
              </p>
              <textarea
                rows={3}
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="Reason for cancellation…"
                className="mt-3 w-full rounded-xl border border-outline-variant/40 bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
              />
              {cancelBooking.isError && (
                <p className="mt-2 text-sm text-error">
                  Could not cancel. Please try again.
                </p>
              )}
              <div className="mt-3 flex gap-3">
                <Button variant="outline" onClick={() => setShowCancel(false)}>
                  Keep booking
                </Button>
                <Button
                  variant="destructive"
                  disabled={cancelBooking.isPending}
                  onClick={handleCancel}
                >
                  {cancelBooking.isPending
                    ? 'Cancelling…'
                    : 'Confirm cancellation'}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar: price + voucher */}
        <aside className="lg:w-80 lg:shrink-0">
          <div className="space-y-6 lg:sticky lg:top-24">
            <div className="rounded-2xl border border-outline-variant/30 bg-surface p-6">
              <h3 className="mb-4 font-be-vietnam font-semibold text-on-surface">
                Price details
              </h3>
              <PriceSummary
                lines={[
                  { label: 'Subtotal', value: booking.subtotal },
                  ...(Number(booking.discountAmount) > 0
                    ? [
                        {
                          label: 'Discount',
                          value: booking.discountAmount,
                          negative: true,
                        },
                      ]
                    : []),
                ]}
                total={booking.totalAmount}
                totalLabel="Total paid"
              />
            </div>

            {booking.status !== 'cancelled' && (
              <div className="rounded-2xl border border-outline-variant/30 bg-surface p-6">
                <h3 className="mb-4 text-center font-be-vietnam font-semibold text-on-surface">
                  Your e-voucher
                </h3>
                <QRVoucher
                  data={booking.voucher?.qrData}
                  label={booking.bookingCode}
                />
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

function Detail({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <div>
      <dt className="flex items-center gap-1.5 text-xs text-on-surface-variant">
        {icon}
        {label}
      </dt>
      <dd className="mt-0.5 font-medium text-on-surface">{value}</dd>
    </div>
  );
}
