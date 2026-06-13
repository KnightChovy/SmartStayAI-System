import { Button } from '@/components/ui/button';
import { AdminTable } from '@/components/admin/shared/AdminTable';
import type { AdminBookingsTableProps } from '@/types/admin.types';

export function AdminBookingsTable({ rows }: AdminBookingsTableProps) {
  return (
    <AdminTable
      headers={[
        'Booking ID',
        'Property',
        'Guest',
        'Dates',
        'Total Price',
        'Status',
        'Actions',
      ]}
      rows={rows}
      renderLastColumn={() => (
        <Button variant="outline" className="rounded-full">
          Details
        </Button>
      )}
    />
  );
}
