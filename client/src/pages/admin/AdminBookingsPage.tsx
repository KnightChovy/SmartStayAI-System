import { AdminPageHeader } from '@/components/admin/shared/AdminPageHeader';
import { AdminBookingsFilters } from '@/components/admin/bookings/AdminBookingsFilters';
import { AdminBookingsTable } from '@/components/admin/bookings/AdminBookingsTable';

const bookings = [
  [
    '#BK-9284',
    'Seaside Villa Retreat',
    'Eleanor Shellstrop',
    'Oct 15 - Oct 20',
    '$1,450.00',
    'Confirmed',
    '',
  ],
  [
    '#BK-9285',
    'Alpine Ski Chalet',
    'Chidi Anagonye',
    'Nov 02 - Nov 08',
    '$2,800.00',
    'Pending',
    '',
  ],
  [
    '#BK-9286',
    'Downtown Urban Loft',
    'Tahani Al-Jamil',
    'Oct 18 - Oct 22',
    '$950.00',
    'Cancelled',
    '',
  ],
];

export function AdminBookingsPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Bookings Management"
        description="Manage and track all property reservations."
      />
      <AdminBookingsFilters searchPlaceholder="Search by property or guest..." />
      <AdminBookingsTable rows={bookings} />
    </div>
  );
}
