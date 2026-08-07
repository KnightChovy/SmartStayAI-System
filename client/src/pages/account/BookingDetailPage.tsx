import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Download,
  Info,
  MapPin,
  PencilLine,
  TimerOff,
  Users,
  Wallet,
  XCircle,
} from 'lucide-react';
import { useBooking, usePaymentHold } from '@/hooks/bookings';
import { useMyReviews } from '@/hooks/account';
import { ROUTES } from '@/constants/routes';
import BackLink from '@/components/shared/BackLink';
import BookingStatusBadge from '@/components/shared/BookingStatusBadge';
import PriceSummary from '@/components/shared/PriceSummary';
import QRVoucher from '@/components/shared/QRVoucher';
import DateRangePicker from '@/components/shared/DateRangePicker';
import GuestSelector from '@/components/shared/GuestSelector';
import ReviewModal from '@/components/account/ReviewModal';
import RefundStatusCard from '@/components/account/RefundStatusCard';
import CancelBookingPanel from '@/components/account/CancelBookingPanel';
import PayNowAction from '@/components/booking/PayNowAction';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDateShort } from '@/utils/formatDate';

/** Trạng thái còn cho phép hủy / đổi. */
const CANCELLABLE = new Set(['pending', 'confirmed']);

export default function BookingDetailPage() {
  const { t } = useTranslation(['account', 'common', 'booking']);
  const { bookingId = '' } = useParams();
  const navigate = useNavigate();
  const { data: booking, isLoading } = useBooking(bookingId);
  // Đơn tạo xong nhưng chưa trả tiền (huỷ giữa chừng ở cổng / đóng tab) vẫn còn hạn giữ chỗ
  // → phải nói rõ và cho đường trả tiền lại, nếu không khách kẹt cho tới lúc cron huỷ đơn.
  const hold = usePaymentHold(booking);
  // Review đã có cho booking này (nếu có) → cho phép sửa thay vì tạo mới.
  const { data: myReviews } = useMyReviews();
  const existingReview = myReviews?.find(r => r.bookingId === bookingId) ?? null;

  const [showCancel, setShowCancel] = useState(false);

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
  const canReview = booking.status === 'checked_out';

  // Yêu cầu hoàn tiền do BE tự tạo lúc huỷ (theo chính sách của KS) — khách không tự gửi.
  const refunds = (booking.payments ?? []).flatMap(p => p.refunds ?? []);
  const hasPaid = (booking.payments ?? []).some(p => p.status === 'completed');
  /**
   * Ví đã được hệ thống hoàn TỰ ĐỘNG khi job dọn đơn quá hạn giữ chỗ (`releaseExpiredHolds`):
   * payment `wallet` chuyển sang `refunded` và tiền vào thẳng ví, **không** sinh `Refund` nào để
   * `RefundStatusCard` bám vào. Không nói ra thì khách nhìn thấy một đơn bị huỷ và không có dòng
   * nào nhắc tới khoản đã trừ — phải mở trang Ví mới biết tiền đã về.
   */
  const walletAutoRefunded =
    booking.status === 'cancelled' && refunds.length === 0
      ? (booking.payments ?? [])
          .filter(p => p.paymentMethod === 'wallet' && p.status === 'refunded')
          .reduce((sum, p) => sum + Number(p.amount), 0)
      : 0;
  /**
   * Phần ví ĐANG chờ được hoàn: đơn quá hạn giữ chỗ nhưng cron `release-holds` (5 phút/lần) chưa
   * quét tới, nên payment ví vẫn `completed`. Nói ra để khách biết tiền sẽ tự về, khỏi đi khiếu nại.
   */
  const walletAwaitingRefund = hold.expired
    ? (booking.payments ?? [])
        .filter(p => p.paymentMethod === 'wallet' && p.status === 'completed')
        .reduce((sum, p) => sum + Number(p.amount), 0)
    : 0;
  /**
   * Đơn trả GHÉP: ví đã gánh một phần, phần còn lại vẫn nợ ở cổng. Bảng giá chỉ có tổng đơn nên
   * khách không cách nào biết mình còn nợ bao nhiêu — mà đúng số đó mới là thứ phải trả trước khi
   * hết hạn giữ chỗ. Hai số lấy thẳng của BE (`amountPaid` / `remainingAmount`), không tự cộng
   * `payments[]`, để khớp từng đồng với số cổng sắp thu.
   */
  const amountPaid = Number(booking.amountPaid);
  const remainingAmount = Number(booking.remainingAmount);
  const partiallyPaid = amountPaid > 0 && remainingAmount > 0;
  // Huỷ muộn bị phạt hết ⇒ BE không tạo refund nào. Phải nói rõ, không để khách chờ tiền.
  const cancelledWithoutRefund =
    booking.status === 'cancelled' && hasPaid && refunds.length === 0;

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

  return (
    <div>
      <BackLink fallbackTo={ROUTES.accountBookings} />

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

          {/* Chưa thanh toán — nói rõ hạn giữ chỗ trước, vì quá hạn là đơn tự huỷ và mất phòng */}
          {hold.awaitingPayment && hold.deadlineLabel && (
            <div className="flex gap-3 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4">
              <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-700" />
              <div>
                <p className="font-semibold text-on-surface">{t('booking:payment.unpaidTitle')}</p>
                <p className="mt-0.5 text-sm text-on-surface-variant">
                  {t('booking:payment.unpaidBody', { time: hold.deadlineLabel })}
                </p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            {/* Đứng đầu hàng: với đơn chưa trả tiền thì đây là việc gấp nhất của khách.
                Banner ngay trên đã nói hạn giữ chỗ nên nút không lặp lại đồng hồ. */}
            <PayNowAction booking={booking} showCountdown={false} />
            {canModify && (
              <Button variant="outline" size="lg" onClick={openModify}>
                <PencilLine className="size-4" /> {t('detail.modify')}
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

          {/* Theo dõi hoàn tiền — dữ liệu thật từ `booking.payments[].refunds[]` */}
          {refunds.map(refund => (
            <RefundStatusCard key={refund.id} refund={refund} />
          ))}

          {/* Quá hạn nhưng cron chưa quét: nút thanh toán đã ẩn, banner hạn giữ chỗ cũng ẩn ⇒
              nếu không có khối này thì khách chỉ thấy một đơn "chờ xác nhận" bất động. */}
          {hold.expired && (
            <div className="flex gap-3 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4">
              <TimerOff className="mt-0.5 size-5 shrink-0 text-amber-700" aria-hidden="true" />
              <div>
                <p className="font-semibold text-on-surface">{t('detail.holdExpiredTitle')}</p>
                <p className="mt-0.5 text-sm text-on-surface-variant">
                  {walletAwaitingRefund > 0
                    ? t('detail.holdExpiredWallet', {
                        amount: formatCurrency(walletAwaitingRefund),
                      })
                    : t('detail.holdExpiredBody')}
                </p>
              </div>
            </div>
          )}

          {walletAutoRefunded > 0 && (
            <div className="flex gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4 text-sm text-on-surface">
              <Wallet className="mt-0.5 size-4 shrink-0 text-emerald-600" aria-hidden="true" />
              <span>
                {/* Cùng một khối phục vụ hai nguyên nhân huỷ khác hẳn nhau: cron dọn đơn quá hạn
                    (`system`) và khách tự bấm huỷ đơn chưa xác nhận. Ghi cứng "hết hạn giữ chỗ"
                    là nói sai cho nửa số ca — khách vừa tự bấm huỷ mà đọc thành đơn tự hết hạn. */}
                {t(
                  booking.cancelledByRole === 'system'
                    ? 'refund.walletAutoRefunded'
                    : 'refund.walletRefundedOnCancel',
                  { amount: formatCurrency(walletAutoRefunded) }
                )}{' '}
                <Link
                  to={ROUTES.accountWallet}
                  className="font-semibold text-primary underline underline-offset-2"
                >
                  {t('refund.openWallet')}
                </Link>
              </span>
            </div>
          )}

          {cancelledWithoutRefund && (
            <div className="flex gap-2 rounded-2xl border border-outline-variant/30 bg-surface-container-low p-4 text-sm text-on-surface-variant">
              <Info className="mt-0.5 size-4 shrink-0" />
              <span>{t('refund.noneTitle')}</span>
            </div>
          )}

          {/*
            Khối huỷ — tách riêng vì nó phải gọi `refund-preview` để nói cho khách biết mất bao
            nhiêu tiền TRƯỚC khi bấm (huỷ không hoàn tác được), và còn hỏi nơi nhận tiền hoàn.
          */}
          {showCancel && (
            <CancelBookingPanel
              bookingId={booking.id}
              payments={booking.payments}
              onClose={() => setShowCancel(false)}
              onCancelled={() => setShowCancel(false)}
            />
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
              {/*
                Thứ tự khớp công thức của BE (subtotal − giảm giá + thuế + phí = tổng) để
                khách cộng nhẩm ra đúng số cuối. Chỉ hiện dòng > 0 nên đơn cũ / khách sạn
                không thu thuế-phí vẫn gọn như trước, không lòi dòng "0 VNĐ".
              */}
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
                  ...(Number(booking.taxAmount) > 0
                    ? [{ label: t('detail.tax'), value: booking.taxAmount }]
                    : []),
                  ...(Number(booking.feeAmount) > 0
                    ? [{ label: t('detail.fee'), value: booking.feeAmount }]
                    : []),
                ]}
                total={booking.totalAmount}
                /* Đơn còn nợ thì "Tổng đã thanh toán" là nói sai — số đó mới là giá đơn. */
                totalLabel={partiallyPaid ? t('common:total') : t('detail.totalPaid')}
                footer={
                  partiallyPaid
                    ? {
                        lines: [
                          {
                            label: t('booking:summary.amountPaid'),
                            value: amountPaid,
                            negative: true,
                          },
                        ],
                        label: t('booking:summary.dueNow'),
                        total: remainingAmount,
                      }
                    : undefined
                }
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
