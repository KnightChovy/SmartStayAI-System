import { MoreHorizontal } from 'lucide-react';
import { AdminPropertiesHeader } from '@/components/admin/properties/AdminPropertiesHeader';
import { AdminTable } from '@/components/admin/shared/AdminTable';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
          headers={[
            'Property',
            'Location',
            'Partner',
            'Status',
            'Created',
            'Actions',
          ]}
          rows={rows}
          showStatusIcons
          renderLastColumn={row => {
            const hotel = data?.results.find(item => item.id === row[5]);
            if (!hotel) return null;

            return (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    aria-label="Open property actions"
                    className="rounded-full"
                    disabled={updateFlags.isPending}
                    size="icon-sm"
                    type="button"
                    variant="outline"
                  >
                    <MoreHorizontal className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>Property actions</DropdownMenuLabel>
                  <DropdownMenuItem
                    disabled={updateFlags.isPending}
                    onSelect={() =>
                      updateFlags.mutate({
                        hotelId: hotel.id,
                        payload: { isListed: !hotel.isListed },
                      })
                    }
                  >
                    {hotel.isListed ? 'Unlist property' : 'List property'}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    disabled={updateFlags.isPending}
                    onSelect={() =>
                      updateFlags.mutate({
                        hotelId: hotel.id,
                        payload: { isActive: !hotel.isActive },
                      })
                    }
                    variant={hotel.isActive ? 'destructive' : 'default'}
                  >
                    {hotel.isActive ? 'Disable property' : 'Enable property'}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
