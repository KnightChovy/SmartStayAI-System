import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/constants/queryKeys';
import { bookingsService } from '@/services/bookings.service';

/** `GET /bookings/:bookingId` — chi tiết một booking. Cần đăng nhập. */
export function useGetBooking(bookingId: string) {
  return useQuery({
    queryKey: queryKeys.bookings.detail(bookingId),
    queryFn: () => bookingsService.getById(bookingId),
    enabled: Boolean(bookingId),
  });
}
