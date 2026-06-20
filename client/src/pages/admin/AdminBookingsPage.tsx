import { AdminPageHeader } from '@/components/admin/shared/AdminPageHeader';
import { AdminBookingsFilters } from '@/components/admin/bookings/AdminBookingsFilters';
import { AdminBookingsTable } from '@/components/admin/bookings/AdminBookingsTable';
import { useAdminBookings } from '@/hooks/admin';
import { errorMessage } from '@/utils/errorMessage';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDateShort } from '@/utils/formatDate';

export function AdminBookingsPage() {
  const { data, isLoading, isError, error } = useAdminBookings();

  const rows =
    data?.map(booking => [
      booking.bookingCode,
      booking.hotelName,
      booking.customer.fullName,
      `${formatDateShort(booking.checkInDate)} - ${formatDateShort(booking.checkOutDate)}`,
      formatCurrency(booking.totalAmount),
      booking.status,
      '',
    ]) ?? [];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Bookings Management"
        description="Manage and track all property reservations."
      />
      <AdminBookingsFilters searchPlaceholder="Search by property or guest..." />
      {isLoading && (
        <p className="text-sm text-muted-foreground">Loading bookings...</p>
      )}
      {isError && (
        <p className="text-sm font-medium text-destructive">
          {errorMessage(error, 'Could not load bookings.')}
        </p>
      )}
      {!isLoading && !isError && <AdminBookingsTable rows={rows} />}
    </div>
  );
}
