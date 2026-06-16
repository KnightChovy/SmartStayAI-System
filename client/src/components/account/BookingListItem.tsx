import { Link } from 'react-router';
import { CalendarDays, MapPin } from 'lucide-react';
import type { Booking } from '@/types/booking.types';
import { ROUTES } from '@/constants/routes';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDateShort } from '@/utils/formatDate';
import BookingStatusBadge from '@/components/shared/BookingStatusBadge';

/** Một dòng booking trong danh sách "Đặt phòng của tôi". */
export default function BookingListItem({ booking }: { booking: Booking }) {
  return (
    <Link
      to={ROUTES.accountBookingDetail(booking.id)}
      className="flex flex-col gap-3 rounded-2xl border border-outline-variant/30 bg-surface p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="min-w-0">
        <div className="flex items-center gap-3">
          <h3 className="truncate font-be-vietnam font-semibold text-on-surface">
            {booking.hotel?.name ?? 'Hotel'}
          </h3>
          <BookingStatusBadge status={booking.status} />
        </div>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-on-surface-variant">
          <MapPin className="size-3.5" /> {booking.roomType?.name ?? '—'}
        </p>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-on-surface-variant">
          <CalendarDays className="size-3.5" />
          {formatDateShort(booking.checkInDate)} → {formatDateShort(booking.checkOutDate)} ·{' '}
          {booking.numNights} night{booking.numNights === 1 ? '' : 's'}
        </p>
      </div>
      <div className="text-right">
        <p className="text-xs text-on-surface-variant">{booking.bookingCode}</p>
        <p className="font-be-vietnam text-lg font-bold text-on-surface">
          {formatCurrency(booking.totalAmount)}
        </p>
      </div>
    </Link>
  );
}
