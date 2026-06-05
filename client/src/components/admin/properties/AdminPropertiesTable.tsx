import { AdminTable } from '@/components/admin/shared/AdminTable';
import type { AdminPropertiesTableProps } from '@/types/admin.types';

export function AdminPropertiesTable({ rows }: AdminPropertiesTableProps) {
  return (
    <AdminTable
      headers={['Property', 'Location', 'Host', 'Status', 'Price/Night']}
      rows={rows}
    />
  );
}
