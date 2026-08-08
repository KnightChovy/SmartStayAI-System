import { useState, type ReactNode } from 'react';
import {
  CalendarCheck,
  LogIn,
  LogOut,
  Banknote,
  UserX,
  Ticket,
  CalendarClock,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/hotel-partner/shared/Modal';
import { Pill } from '@/components/hotel-partner/shared/Pill';
import { ConfirmDialog } from '@/components/hotel-partner/shared/ConfirmDialog';
import { ErrorState } from '@/components/hotel-partner/shared/states';
import { DetailSkeleton } from '@/components/shared/skeletons';
import {
  useHotelBooking,
  useHotelRooms,
  useRecordCashPayment,
  useMarkNoShow,
} from '@/hooks/staff';
import { errorMessage } from '@/utils/errorMessage';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate, toUtcDateKey, todayUtcKey } from '@/utils/formatDate';
import {
  BOOKING_STATUS_CONFIG,
  PAYMENT_STATUS_CONFIG,
  PAYMENT_METHOD_LABELS,
} from './labels';
import { CheckInModal } from './CheckInModal';
import { CheckOutModal } from './CheckOutModal';

interface BookingDetailModalProps {
  open: boolean;
  onClose: () => void;
  hotelId: string;
  bookingId: string | null;
}

/** Chi tiết booking + thao tác vận hành (check-in/out, thu tiền mặt, no-show). */
export function BookingDetailModal({ open, onClose, hotelId, bookingId }: BookingDetailModalProps) {
  const { data: booking, isLoading, isError } = useHotelBooking(hotelId, bookingId ?? undefined);
  const { data: rooms } = useHotelRooms(hotelId);

  const recordCash = useRecordCashPayment(hotelId);
  const noShow = useMarkNoShow(hotelId);

  const [checkInOpen, setCheckInOpen] = useState(false);
  const [checkOutOpen, setCheckOutOpen] = useState(false);
  const [confirm, setConfirm] = useState<'cash' | 'noshow' | null>(null);

  const pendingCashPayment = booking?.payments.find(
    p => p.paymentMethod === 'cash' && p.status === 'pending'
  );

  const today = todayUtcKey();
  const checkInKey = booking ? toUtcDateKey(booking.checkInDate) : '';
  const checkOutKey = booking ? toUtcDateKey(booking.checkOutDate) : '';
  const beforeWindow = !!booking && today < checkInKey;
  const afterWindow = !!booking && today >= checkOutKey;
  const canCheckIn = booking?.status === 'confirmed' && !beforeWindow && !afterWindow;
  const canNoShow = booking?.status === 'confirmed' && today >= checkInKey;
  // BE từ chối thu tiền mặt nếu booking đã huỷ — không hiện nút trong trường hợp đó.
  const canCollectCash = !!pendingCashPayment && booking?.status !== 'cancelled';

  const availableRooms = (rooms ?? []).filter(
    r => booking && r.roomTypeId === booking.roomTypeId && r.status === 'available'
  );

  const assignedRooms = booking?.bookingRooms
    .map(r => r.room?.roomNumber ?? r.roomId.slice(0, 6))
    .join(', ');

  const confirmCash = async () => {
    if (!booking) return;
    try {
      await recordCash.mutateAsync({ bookingId: booking.id });
      toast.success('Cash payment recorded');
      setConfirm(null);
    } catch (err) {
      toast.error(errorMessage(err, 'Failed to record cash payment'));
    }
  };

  const confirmNoShow = async () => {
    if (!booking) return;
    try {
      await noShow.mutateAsync({ bookingId: booking.id });
      toast.success('Marked as no-show');
      setConfirm(null);
    } catch (err) {
      toast.error(errorMessage(err, 'Failed to mark as no-show'));
    }
  };

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title={booking ? booking.customer.fullName : 'Booking detail'}
        description={booking?.bookingCode}
        icon={CalendarCheck}
        size="lg"
        footer={
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        }
      >
        {isLoading ? (
          <DetailSkeleton sections={2} />
        ) : isError || !booking ? (
          <ErrorState label="Could not load this booking." />
        ) : (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <Pill className={BOOKING_STATUS_CONFIG[booking.status].class}>
                {BOOKING_STATUS_CONFIG[booking.status].label}
              </Pill>
              <span className="text-xs text-slate-400">
                Created {formatDate(booking.createdAt)}
              </span>
            </div>

            <Card title="Stay details">
              <Row label="Room type" value={booking.roomType.name} />
              <Row label="Guests" value={`${booking.numGuests} guest(s)`} />
              <Row
                label="Check-in → Check-out"
                value={`${formatDate(booking.checkInDate)} → ${formatDate(
                  booking.checkOutDate
                )} (${booking.numNights} night(s))`}
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
              <Card title="QR check-in">
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
              {booking.discountAmount !== '0' && booking.discountAmount !== '0.00' && (
                <Row label="Discount" value={`- ${formatCurrency(booking.discountAmount)}`} />
              )}
              <div className="pt-2">
                {booking.payments.length === 0 && (
                  <p className="text-sm text-slate-400">No transactions yet.</p>
                )}
                {booking.payments.map(p => (
                  <div key={p.id} className="flex items-center justify-between py-1 text-sm">
                    <span className="text-slate-600">
                      {PAYMENT_METHOD_LABELS[p.paymentMethod]} · {formatCurrency(p.amount)}
                    </span>
                    <Pill className={PAYMENT_STATUS_CONFIG[p.status].class}>
                      {PAYMENT_STATUS_CONFIG[p.status].label}
                    </Pill>
                  </div>
                ))}
              </div>
              {booking.invoice && (
                <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-2 text-sm">
                  <span className="text-slate-500">Invoice {booking.invoice.invoiceNumber}</span>
                  <span className="font-medium text-slate-900">
                    {formatCurrency(booking.invoice.totalAmount)}
                  </span>
                </div>
              )}
            </Card>

            {/* Actions */}
            <div className="rounded-xl border border-slate-200 p-4">
              <h3 className="mb-3 text-sm font-semibold text-slate-900">Front desk actions</h3>

              {beforeWindow && booking.status === 'confirmed' && (
                <div className="mb-3 flex items-start gap-2 rounded-lg bg-amber-50 p-2.5 text-xs text-amber-700">
                  <CalendarClock className="mt-0.5 size-3.5 shrink-0" />
                  The check-in date ({formatDate(booking.checkInDate)}) has not arrived yet.
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                {canCheckIn && (
                  <Button
                    onClick={() => setCheckInOpen(true)}
                    className="bg-role-partner-primary text-white hover:bg-role-partner-secondary"
                  >
                    <LogIn className="mr-1.5 size-4" /> Check-in
                  </Button>
                )}
                {booking.status === 'checked_in' && (
                  <Button
                    onClick={() => setCheckOutOpen(true)}
                    className="bg-role-partner-primary text-white hover:bg-role-partner-secondary"
                  >
                    <LogOut className="mr-1.5 size-4" /> Check-out
                  </Button>
                )}
                {canCollectCash && (
                  <Button variant="outline" onClick={() => setConfirm('cash')}>
                    <Banknote className="mr-1.5 size-4" /> Collect cash
                  </Button>
                )}
                {canNoShow && (
                  <Button
                    variant="outline"
                    className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                    onClick={() => setConfirm('noshow')}
                  >
                    <UserX className="mr-1.5 size-4" /> Mark no-show
                  </Button>
                )}
              </div>

              {!canCheckIn &&
                booking.status !== 'checked_in' &&
                !canCollectCash &&
                !canNoShow && (
                  <p className="text-sm text-slate-400">
                    {booking.status === 'pending'
                      ? 'Awaiting online payment from the guest (VNPay).'
                      : 'No actions available for this booking.'}
                  </p>
                )}

              {afterWindow && booking.status === 'confirmed' && (
                <p className="mt-2 text-xs text-rose-500">
                  The stay period has passed — this should be handled as a no-show.
                </p>
              )}
            </div>
          </div>
        )}
      </Modal>

      {booking && (
        <>
          <CheckInModal
            open={checkInOpen}
            onClose={() => setCheckInOpen(false)}
            hotelId={hotelId}
            booking={booking}
            availableRooms={availableRooms}
          />
          <CheckOutModal
            open={checkOutOpen}
            onClose={() => setCheckOutOpen(false)}
            hotelId={hotelId}
            booking={booking}
          />
          <ConfirmDialog
            open={confirm === 'cash'}
            onClose={() => setConfirm(null)}
            onConfirm={confirmCash}
            title="Record cash payment"
            message={`Confirm that ${formatCurrency(
              pendingCashPayment?.amount ?? booking.totalAmount
            )} has been collected in cash for ${booking.bookingCode}?`}
            confirmLabel="Mark as paid"
            loading={recordCash.isPending}
          />
          <ConfirmDialog
            open={confirm === 'noshow'}
            onClose={() => setConfirm(null)}
            onConfirm={confirmNoShow}
            title="Mark as no-show"
            message={`Mark ${booking.customer.fullName} as a no-show? Any pending cash payment will be voided. This cannot be undone.`}
            confirmLabel="Mark no-show"
            loading={noShow.isPending}
            destructive
          />
        </>
      )}
    </>
  );
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <h3 className="mb-2 text-sm font-semibold text-slate-900">{title}</h3>
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
