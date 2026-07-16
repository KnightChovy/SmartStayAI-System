import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Banknote, CalendarDays, MapPin } from 'lucide-react';
import type { Booking } from '@/types/booking.types';
import { ROUTES } from '@/constants/routes';
import { useMoney } from '@/hooks/currency';
import { formatDateShort } from '@/utils/formatDate';
import BookingStatusBadge from '@/components/shared/BookingStatusBadge';

/** Một dòng booking trong danh sách "Đặt phòng của tôi". */
export default function BookingListItem({ booking }: { booking: Booking }) {
  const { t } = useTranslation(['account', 'common']);
  const { format } = useMoney();
  // Hoàn tiền mới nhất (BE sort desc) — đơn đã huỷ thì đây là thứ khách quan tâm nhất.
  const refund = (booking.payments ?? []).flatMap(p => p.refunds ?? [])[0];
  return (
    <Link
      to={ROUTES.accountBookingDetail(booking.id)}
      className="flex flex-col gap-3 rounded-2xl border border-outline-variant/30 bg-surface p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="min-w-0">
        <div className="flex items-center gap-3">
          <h3 className="truncate font-be-vietnam font-semibold text-on-surface">
            {booking.hotel?.name ?? t('hotel')}
          </h3>
          <BookingStatusBadge status={booking.status} />
        </div>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-on-surface-variant">
          <MapPin className="size-3.5" /> {booking.roomType?.name ?? '—'}
        </p>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-on-surface-variant">
          <CalendarDays className="size-3.5" />
          {formatDateShort(booking.checkInDate)} → {formatDateShort(booking.checkOutDate)} ·{' '}
          {t('common:nights', { count: booking.numNights })}
        </p>
        {refund && (
          <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-surface-container-low px-2.5 py-1 text-xs font-medium text-on-surface-variant">
            <Banknote className="size-3.5" />
            {t('refund.title')} · {t(`refund.status.${refund.status}`)}
          </p>
        )}
      </div>
      <div className="text-right">
        <p className="text-xs text-on-surface-variant">{booking.bookingCode}</p>
        <p className="font-be-vietnam text-lg font-bold text-on-surface">
          {format(booking.totalAmount)}
        </p>
      </div>
    </Link>
  );
}
