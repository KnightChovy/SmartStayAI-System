import { AdminPropertiesHeader } from '@/components/admin/properties/AdminPropertiesHeader';
import { AdminPropertiesTable } from '@/components/admin/properties/AdminPropertiesTable';

const rows = [
  ['Azure Horizon Villa', 'Santorini, Greece', 'Elena K.', 'ACTIVE', '$850'],
  ['Cedar Ridge Retreat', 'Aspen, Colorado', 'James S.', 'PENDING', '$420'],
  [
    'Metropolitan Sky Loft',
    'Tokyo, Japan',
    'Hiroshi K.',
    'SUSPENDED',
    '$1,200',
  ],
  ['Echo Park Modernist', 'Los Angeles, CA', 'Marcus W.', 'ACTIVE', '$290'],
  ['Coral Bay Sanctuary', 'Maldives', 'Sarah L.', 'ACTIVE', '$1,550'],
];

export function AdminPropertiesPage() {
  return (
    <div className="space-y-6">
      <AdminPropertiesHeader />
      <AdminPropertiesTable rows={rows} />
    </div>
  );
}
