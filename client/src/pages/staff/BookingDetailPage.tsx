import { useState, type ReactNode } from 'react';
import { Link, useParams } from 'react-router';
import { ArrowLeft, LogIn, LogOut, Banknote, UserX, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  useHotelBooking,
  useCheckIn,
  useCheckOut,
  useRecordCashPayment,
  useMarkNoShow,
} from '@/hooks/staff';
import { useStaffHotelStore } from '@/stores/staffHotelStore';
import { BookingStatusBadge, PaymentStatusBadge } from '@/components/staff/StatusBadge';
import { ROUTES } from '@/constants/routes';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDateShort } from '@/utils/formatDate';
import { errorMessage } from '@/utils/errorMessage';

export default function BookingDetailPage() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const hotel = useStaffHotelStore(state => state.hotel);
  const { data: booking, isLoading, isError } = useHotelBooking(hotel?.id, bookingId);

  const checkIn = useCheckIn(hotel?.id);
  const checkOut = useCheckOut(hotel?.id);
  const recordCash = useRecordCashPayment(hotel?.id);
  const noShow = useMarkNoShow(hotel?.id);

  const [voucherCode, setVoucherCode] = useState('');
  const [extraCharge, setExtraCharge] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; msg: string } | null>(null);

  if (isLoading) return <p className="text-sm text-slate-500">Đang tải booking…</p>;
  if (isError || !booking)
    return (
      <div className="space-y-3">
        <BackLink />
        <p className="text-sm text-rose-600">Không tải được booking (có thể bạn không có quyền).</p>
      </div>
    );

  const pendingCashPayment = booking.payments.find(
    p => p.paymentMethod === 'cash' && p.status === 'pending'
  );

  const run = async (
    action: () => Promise<unknown>,
    okMsg: string,
    fallbackErr: string
  ) => {
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
        {/* Thông tin */}
        <div className="space-y-4 lg:col-span-2">
          <Card title="Thông tin lưu trú">
            <Row label="Loại phòng" value={booking.roomType.name} />
            <Row label="Số khách" value={`${booking.numGuests} khách`} />
            <Row
              label="Nhận → Trả phòng"
              value={`${formatDateShort(booking.checkInDate)} → ${formatDateShort(booking.checkOutDate)} (${booking.numNights} đêm)`}
            />
            {booking.bookingRooms.length > 0 && (
              <Row
                label="Phòng đã gán"
                value={booking.bookingRooms
                  .map(r => r.room?.roomNumber ?? r.roomId.slice(0, 6))
                  .join(', ')}
              />
            )}
            {booking.specialRequests && (
              <Row label="Yêu cầu đặc biệt" value={booking.specialRequests} />
            )}
          </Card>

          <Card title="Khách hàng">
            <Row label="Email" value={booking.customer.email} />
            <Row label="Điện thoại" value={booking.customer.phone ?? '—'} />
          </Card>

          <Card title="Thanh toán">
            <Row label="Tổng tiền" value={formatCurrency(booking.totalAmount)} />
            {booking.discountAmount !== '0' && (
              <Row label="Giảm giá" value={`- ${formatCurrency(booking.discountAmount)}`} />
            )}
            <div className="pt-2">
              {booking.payments.length === 0 && (
                <p className="text-sm text-slate-400">Chưa có giao dịch.</p>
              )}
              {booking.payments.map(p => (
                <div key={p.id} className="flex items-center justify-between py-1 text-sm">
                  <span className="text-slate-600">
                    {p.paymentMethod === 'cash' ? 'Tiền mặt' : 'VNPay'} · {formatCurrency(p.amount)}
                  </span>
                  <PaymentStatusBadge status={p.status} />
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Hành động */}
        <div className="space-y-3">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h2 className="mb-3 text-sm font-semibold text-slate-900">Thao tác lễ tân</h2>

            {booking.status === 'confirmed' && (
              <div className="mb-3 space-y-2">
                <Label htmlFor="voucher" className="text-xs text-slate-500">
                  Mã voucher (không bắt buộc)
                </Label>
                <Input
                  id="voucher"
                  value={voucherCode}
                  onChange={e => setVoucherCode(e.target.value)}
                  placeholder="VC…"
                />
                <Button
                  className="w-full"
                  disabled={busy}
                  onClick={() =>
                    run(
                      () =>
                        checkIn.mutateAsync({
                          bookingId: booking.id,
                          payload: voucherCode ? { voucherCode } : {},
                        }),
                      'Đã check-in khách thành công.',
                      'Check-in thất bại.'
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
                  Phụ phí (nếu có)
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
                      'Đã check-out khách thành công.',
                      'Check-out thất bại.'
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
                    'Đã ghi nhận thu tiền mặt.',
                    'Ghi nhận tiền mặt thất bại.'
                  )
                }
              >
                <Banknote className="size-4" /> Thu tiền mặt
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
                    'Đã đánh dấu khách không đến.',
                    'Đánh dấu no-show thất bại.'
                  )
                }
              >
                <UserX className="size-4" /> Đánh dấu không đến
              </Button>
            )}

            {['checked_out', 'cancelled', 'no_show'].includes(booking.status) && (
              <p className="text-sm text-slate-400">Booking đã kết thúc, không còn thao tác.</p>
            )}
            {booking.status === 'pending' && !pendingCashPayment && (
              <p className="text-sm text-slate-400">
                Booking đang chờ khách thanh toán online (VNPay).
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
      <ArrowLeft className="size-4" /> Quầy lễ tân
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
