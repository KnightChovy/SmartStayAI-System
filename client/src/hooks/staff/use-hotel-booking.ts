import { useQuery } from '@tanstack/react-query';
import { staffService } from '@/services/staff.service';
import { staffKeys } from './keys';

/** Detail of a single hotel booking (for the front desk screen). */
export function useHotelBooking(hotelId: string | undefined, bookingId: string | undefined) {
  return useQuery({
    queryKey: staffKeys.booking(hotelId ?? '', bookingId ?? ''),
    queryFn: () => staffService.getBooking(hotelId as string, bookingId as string),
    enabled: Boolean(hotelId && bookingId),
  });
}
