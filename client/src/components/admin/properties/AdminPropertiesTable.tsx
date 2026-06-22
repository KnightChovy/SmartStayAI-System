import { AdminTable } from '@/components/admin/shared/AdminTable';
import type { AdminPropertiesTableProps } from '@/types/admin.types';

export function AdminPropertiesTable({ rows }: AdminPropertiesTableProps) {
  return (
    <AdminTable
      headers={['Property', 'Location', 'Partner', 'Status', 'Submitted']}
      rows={rows}
    />
  );
}
