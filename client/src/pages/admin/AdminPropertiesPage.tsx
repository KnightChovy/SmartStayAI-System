import { AdminPropertiesHeader } from '@/components/admin/properties/AdminPropertiesHeader';
import { AdminPropertiesTable } from '@/components/admin/properties/AdminPropertiesTable';
import { useAdminVerificationRequests } from '@/hooks/admin';
import { errorMessage } from '@/utils/errorMessage';
import { formatDateShort } from '@/utils/formatDate';

export function AdminPropertiesPage() {
  const { data, isLoading, isError, error } = useAdminVerificationRequests({
    limit: 20,
    sortBy: 'submittedAt:desc',
  });

  const rows =
    data?.results.map(request => [
      request.hotel.name,
      [request.hotel.city, request.hotel.country].filter(Boolean).join(', '),
      request.partner.businessName,
      request.status.toUpperCase(),
      formatDateShort(request.submittedAt),
    ]) ?? [];

  return (
    <div className="space-y-6">
      <AdminPropertiesHeader />
      {isLoading && (
        <p className="text-sm text-muted-foreground">
          Loading property requests...
        </p>
      )}
      {isError && (
        <p className="text-sm font-medium text-destructive">
          {errorMessage(error, 'Could not load property requests.')}
        </p>
      )}
      {!isLoading && !isError && <AdminPropertiesTable rows={rows} />}
    </div>
  );
}
