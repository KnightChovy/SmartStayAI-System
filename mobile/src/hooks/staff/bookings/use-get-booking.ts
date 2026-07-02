import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/constants/queryKeys';
import { staffService } from '@/services/staff.service';

/** `GET /hotels/:hotelId/bookings/:bookingId` — chi tiết 1 booking cho staff. */
export function useGetBooking(hotelId: string, bookingId: string) {
  return useQuery({
    queryKey: queryKeys.staff.booking(hotelId, bookingId),
    queryFn: () => staffService.getBooking(hotelId, bookingId),
    enabled: !!hotelId && !!bookingId,
  });
}
