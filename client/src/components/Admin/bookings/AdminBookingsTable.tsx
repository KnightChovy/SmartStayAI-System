import { Button } from '@/components/ui/button';
import { AdminTable } from '@/components/Admin/shared/AdminTable';

interface AdminBookingsTableProps {
  rows: string[][];
}

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
