import { useQuery } from '@tanstack/react-query';
import { bookingService } from '@/services/booking.service';
import { queryKeys } from '@/constants/queryKeys';

/** Chi tiết một booking. */
export function useBooking(bookingId: string) {
  return useQuery({
    queryKey: queryKeys.bookings.detail(bookingId),
    queryFn: () => bookingService.getById(bookingId),
    enabled: !!bookingId,
  });
}
