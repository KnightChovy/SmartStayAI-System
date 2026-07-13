import { useLocation, useNavigate, useParams } from 'react-router';
import { CalendarDays, CheckCircle2, Download, MapPin } from 'lucide-react';
import { useBooking } from '@/hooks/bookings';
import { ROUTES } from '@/constants/routes';
import QRVoucher from '@/components/shared/QRVoucher';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDateShort } from '@/utils/formatDate';
import type { Booking } from '@/types/booking.types';

export default function BookingSuccessPage() {
  const { bookingId = '' } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Ưu tiên booking truyền qua state (vừa tạo xong), fallback fetch theo id
  const stateBooking =
    (location.state as { booking?: Booking } | null)?.booking ?? null;
  const { data: fetched, isLoading } = useBooking(
    stateBooking ? '' : bookingId
  );
  const booking = stateBooking ?? fetched;

  if (isLoading && !booking) {
    return (
      <div className="mx-auto max-w-2xl px-margin-mobile py-16 md:px-8">
        <Skeleton className="h-96 w-full rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="w-full py-12">
      <div className="mx-auto max-w-2xl px-margin-mobile md:px-8">
        <div className="overflow-hidden rounded-3xl border border-outline-variant/30 bg-surface">
          {/* Header */}
          <div className="flex flex-col items-center bg-primary/5 px-6 py-10 text-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-primary/15 text-primary">
              <CheckCircle2 className="size-9" />
            </div>
            <h1 className="mt-4 font-be-vietnam text-2xl font-bold text-on-surface">
              Booking confirmed!
            </h1>
            <p className="mt-1 text-sm text-on-surface-variant">
              A confirmation has been sent to your email. Show the QR below at
              check-in.
            </p>
          </div>

          <div className="grid gap-8 p-6 sm:grid-cols-[1fr_auto] sm:items-center">
            <div className="space-y-3">
              <div>
                <p className="text-xs text-on-surface-variant">Booking code</p>
                <p className="font-be-vietnam text-xl font-bold tracking-wider text-on-surface">
                  {booking?.bookingCode ?? '—'}
                </p>
              </div>
              {booking?.hotel && (
                <p className="flex items-center gap-2 text-sm text-on-surface">
                  <MapPin className="size-4 text-on-surface-variant" />
                  {booking.hotel.name}
                </p>
              )}
              <p className="flex items-center gap-2 text-sm text-on-surface-variant">
                <CalendarDays className="size-4" />
                {formatDateShort(booking?.checkInDate)} →{' '}
                {formatDateShort(booking?.checkOutDate)}
                {booking
                  ? ` · ${booking.numNights} night${booking.numNights === 1 ? '' : 's'}`
                  : ''}
              </p>
              {booking && (
                <p className="text-sm">
                  <span className="text-on-surface-variant">Total paid: </span>
                  <span className="font-semibold text-on-surface">
                    {formatCurrency(booking.totalAmount)}
                  </span>
                </p>
              )}
            </div>

            <QRVoucher
              data={booking?.voucher?.qrData}
              label={booking?.bookingCode}
            />
          </div>

          <div className="flex flex-col gap-3 border-t border-outline-variant/30 p-6 sm:flex-row">
            <Button
              variant="outline"
              size="lg"
              className="flex-1"
              onClick={() => window.print()}
            >
              <Download className="size-4" /> Save voucher
            </Button>
            <Button
              size="lg"
              className="flex-1 bg-on-surface text-white hover:bg-primary"
              onClick={() => navigate(ROUTES.accountBookings)}
            >
              View my bookings
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
