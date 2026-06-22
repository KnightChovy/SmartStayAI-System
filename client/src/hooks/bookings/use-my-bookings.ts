import { useQuery } from '@tanstack/react-query';
import { bookingService } from '@/services/booking.service';
import { queryKeys } from '@/constants/queryKeys';
import type { MyBookingsParams } from '@/types/booking.types';

/** Danh sách booking của tôi. */
export function useMyBookings(params: MyBookingsParams = {}) {
  return useQuery({
    queryKey: queryKeys.bookings.mine(params),
    queryFn: () => bookingService.getMine(params),
  });
}
