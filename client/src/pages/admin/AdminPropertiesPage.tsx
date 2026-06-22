import { AdminPropertiesHeader } from '@/components/admin/properties/AdminPropertiesHeader';
import { AdminTable } from '@/components/admin/shared/AdminTable';
import { Button } from '@/components/ui/button';
import { useAdminHotels, useUpdateAdminHotelFlags } from '@/hooks/admin';
import { errorMessage } from '@/utils/errorMessage';
import { formatDateShort } from '@/utils/formatDate';

export function AdminPropertiesPage() {
  const { data, isLoading, isError, error } = useAdminHotels({
    limit: 20,
  });
  const updateFlags = useUpdateAdminHotelFlags();

  const rows =
    data?.results.map(hotel => [
      hotel.name,
      hotel.city,
      hotel.partner?.businessName ?? '—',
      `${hotel.isActive ? 'Active' : 'Inactive'} / ${hotel.isListed ? 'Listed' : 'Unlisted'}`,
      formatDateShort(hotel.createdAt),
      hotel.id,
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
          {errorMessage(error, 'Could not load properties.')}
        </p>
      )}
      {!isLoading && !isError && (
        <AdminTable
          headers={['Property', 'Location', 'Partner', 'Status', 'Created', 'Actions']}
          rows={rows}
          renderLastColumn={row => {
            const hotel = data?.results.find(item => item.id === row[5]);
            if (!hotel) return null;

            return (
              <div className="flex flex-wrap gap-2">
                <Button
                  className="h-8 rounded-full px-3 text-xs"
                  disabled={updateFlags.isPending}
                  variant="outline"
                  onClick={() =>
                    updateFlags.mutate({
                      hotelId: hotel.id,
                      payload: { isListed: !hotel.isListed },
                    })
                  }
                >
                  {hotel.isListed ? 'Unlist' : 'List'}
                </Button>
                <Button
                  className="h-8 rounded-full px-3 text-xs"
                  disabled={updateFlags.isPending}
                  variant="outline"
                  onClick={() =>
                    updateFlags.mutate({
                      hotelId: hotel.id,
                      payload: { isActive: !hotel.isActive },
                    })
                  }
                >
                  {hotel.isActive ? 'Disable' : 'Enable'}
                </Button>
              </div>
            );
          }}
        />
      )}
      {updateFlags.isError && (
        <p className="text-sm font-medium text-destructive">
          {errorMessage(updateFlags.error, 'Could not update property.')}
        </p>
      )}
    </div>
  );
}
