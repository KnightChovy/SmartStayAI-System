import { AdminTable } from '@/components/Admin/shared/AdminTable';

interface AdminPropertiesTableProps {
  rows: string[][];
}

export function AdminPropertiesTable({ rows }: AdminPropertiesTableProps) {
  return (
    <AdminTable
      headers={['Property', 'Location', 'Host', 'Status', 'Price/Night']}
      rows={rows}
    />
  );
}
