import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { useTranslation } from 'react-i18next';
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
import { useMyReviews } from '@/hooks/account';
import { ROUTES } from '@/constants/routes';
import BookingStatusBadge from '@/components/shared/BookingStatusBadge';
import PriceSummary from '@/components/shared/PriceSummary';
import QRVoucher from '@/components/shared/QRVoucher';
import DateRangePicker from '@/components/shared/DateRangePicker';
import GuestSelector from '@/components/shared/GuestSelector';
import ReviewModal from '@/components/account/ReviewModal';
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
  const { t } = useTranslation(['account', 'common']);
  const { bookingId = '' } = useParams();
  const navigate = useNavigate();
  const { data: booking, isLoading } = useBooking(bookingId);
  const cancelBooking = useCancelBooking();
  // Review đã có cho booking này (nếu có) → cho phép sửa thay vì tạo mới.
  const { data: myReviews } = useMyReviews();
  const existingReview = myReviews?.find(r => r.bookingId === bookingId) ?? null;

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
  const [showReview, setShowReview] = useState(false);

  if (isLoading) {
    return <Skeleton className="h-96 w-full rounded-3xl" />;
  }

  if (!booking) {
    return (
      <div className="rounded-2xl border border-outline-variant/30 bg-surface p-10 text-center">
        <p className="text-on-surface-variant">{t('detail.notFound')}</p>
        <Button
          className="mt-4"
          variant="outline"
          onClick={() => navigate(ROUTES.accountBookings)}
        >
          {t('detail.backToBookings')}
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
        <ArrowLeft className="size-4" /> {t('detail.back')}
      </Link>

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Main */}
        <div className="min-w-0 flex-1 space-y-6">
          <div className="rounded-2xl border border-outline-variant/30 bg-surface p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-be-vietnam text-2xl font-bold text-on-surface">
                {booking.hotel?.name ?? t('hotel')}
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
              <Detail label={t('detail.bookingCode')} value={booking.bookingCode} />
              <Detail label={t('detail.roomType')} value={booking.roomType?.name ?? '—'} />
              <Detail
                label={t('detail.stay')}
                value={`${formatDateShort(booking.checkInDate)} → ${formatDateShort(booking.checkOutDate)}`}
                icon={<CalendarDays className="size-4" />}
              />
              <Detail
                label={t('detail.guests')}
                value={`${booking.numGuests} · ${t('common:nights', { count: booking.numNights })}`}
                icon={<Users className="size-4" />}
              />
            </dl>

            {booking.specialRequests && (
              <div className="mt-4 rounded-xl bg-surface-container-low p-3 text-sm">
                <span className="font-semibold text-on-surface">
                  {t('detail.specialRequests')}
                </span>
                <span className="text-on-surface-variant">
                  {booking.specialRequests}
                </span>
              </div>
            )}

            {booking.cancellationReason && (
              <div className="mt-4 rounded-xl bg-error/10 p-3 text-sm text-error">
                {t('detail.cancelledReason', { reason: booking.cancellationReason })}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            {canModify && (
              <Button variant="outline" size="lg" onClick={openModify}>
                <PencilLine className="size-4" /> {t('detail.modify')}
              </Button>
            )}
            {canRefund && (
              <Button
                variant="outline"
                size="lg"
                onClick={() => setShowRefund(true)}
              >
                <Receipt className="size-4" /> {t('detail.requestRefund')}
              </Button>
            )}
            <Button variant="outline" size="lg" onClick={downloadInvoice}>
              <Download className="size-4" /> {t('detail.invoice')}
            </Button>
            {canCancel && (
              <Button
                variant="destructive"
                size="lg"
                onClick={() => setShowCancel(true)}
              >
                <XCircle className="size-4" /> {t('detail.cancelBooking')}
              </Button>
            )}
            {canReview && (
              <Button
                size="lg"
                className="bg-on-surface text-white hover:bg-primary"
                onClick={() => setShowReview(true)}
              >
                <PencilLine className="size-4" />
                {existingReview ? t('detail.editFeedback') : t('detail.writeReview')}
              </Button>
            )}
          </div>

          {/* Modify reservation (mock — gửi yêu cầu) */}
          {showModify && (
            <div className="rounded-2xl border border-outline-variant/30 bg-surface p-5">
              <h3 className="font-be-vietnam font-semibold text-on-surface">
                {t('detail.modifyTitle')}
              </h3>
              {modifySent ? (
                <p className="mt-3 flex items-center gap-2 rounded-xl bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700">
                  <CheckCircle2 className="size-4" /> {t('detail.modifySent')}
                </p>
              ) : (
                <>
                  <p className="mt-1 text-sm text-on-surface-variant">
                    {t('detail.modifyDesc')}
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
                      {t('detail.cancel')}
                    </Button>
                    <Button
                      className="bg-on-surface text-white hover:bg-primary"
                      onClick={() => setModifySent(true)}
                    >
                      {t('detail.sendRequest')}
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
                {t('detail.refundTitle')}
              </h3>
              {refundSent ? (
                <p className="mt-3 flex items-center gap-2 rounded-xl bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700">
                  <CheckCircle2 className="size-4" /> {t('detail.refundSent', { amount: formatCurrency(booking.totalAmount) })}
                </p>
              ) : (
                <>
                  <p className="mt-1 text-sm text-on-surface-variant">
                    {t('detail.refundableAmount')}
                    <strong>{formatCurrency(booking.totalAmount)}</strong>{t('detail.refundDesc')}
                  </p>
                  <textarea
                    rows={3}
                    value={refundReason}
                    onChange={e => setRefundReason(e.target.value)}
                    placeholder={t('detail.refundReasonPlaceholder')}
                    className="mt-3 w-full rounded-xl border border-outline-variant/40 bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
                  />
                  <div className="mt-3 flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setShowRefund(false)}
                    >
                      {t('detail.cancel')}
                    </Button>
                    <Button
                      className="bg-on-surface text-white hover:bg-primary"
                      disabled={!refundReason.trim()}
                      onClick={() => setRefundSent(true)}
                    >
                      {t('detail.submitRequest')}
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
                {t('detail.cancelTitle')}
              </h3>
              <p className="mt-1 text-sm text-on-surface-variant">
                {t('detail.cancelDesc')}
              </p>
              <textarea
                rows={3}
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder={t('detail.cancelReasonPlaceholder')}
                className="mt-3 w-full rounded-xl border border-outline-variant/40 bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
              />
              {cancelBooking.isError && (
                <p className="mt-2 text-sm text-error">
                  {t('detail.cancelError')}
                </p>
              )}
              <div className="mt-3 flex gap-3">
                <Button variant="outline" onClick={() => setShowCancel(false)}>
                  {t('detail.keepBooking')}
                </Button>
                <Button
                  variant="destructive"
                  disabled={cancelBooking.isPending}
                  onClick={handleCancel}
                >
                  {cancelBooking.isPending
                    ? t('detail.cancelling')
                    : t('detail.confirmCancel')}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Write review modal (mở ngay tại trang, điền sẵn hotel + booking code) */}
        {canReview && (
          <ReviewModal
            open={showReview}
            onClose={() => setShowReview(false)}
            bookingId={booking.id}
            hotelName={booking.hotel?.name ?? t('hotel')}
            bookingCode={booking.bookingCode}
            existingReview={existingReview}
          />
        )}

        {/* Sidebar: price + voucher */}
        <aside className="lg:w-80 lg:shrink-0">
          <div className="space-y-6 lg:sticky lg:top-24">
            <div className="rounded-2xl border border-outline-variant/30 bg-surface p-6">
              <h3 className="mb-4 font-be-vietnam font-semibold text-on-surface">
                {t('detail.priceDetails')}
              </h3>
              <PriceSummary
                lines={[
                  { label: t('detail.subtotal'), value: booking.subtotal },
                  ...(Number(booking.discountAmount) > 0
                    ? [
                        {
                          label: t('detail.discount'),
                          value: booking.discountAmount,
                          negative: true,
                        },
                      ]
                    : []),
                ]}
                total={booking.totalAmount}
                totalLabel={t('detail.totalPaid')}
              />
            </div>

            {booking.status !== 'cancelled' && (
              <div className="rounded-2xl border border-outline-variant/30 bg-surface p-6">
                <h3 className="mb-4 text-center font-be-vietnam font-semibold text-on-surface">
                  {t('detail.evoucher')}
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
