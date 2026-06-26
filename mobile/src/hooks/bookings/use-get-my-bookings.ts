import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/constants/queryKeys';
import { bookingsService } from '@/services/bookings.service';
import type { MyBookingsParams } from '@/types/bookings.type';

/** `GET /bookings/me` — danh sách booking của tôi. Cần đăng nhập. */
export function useGetMyBookings(params: MyBookingsParams = {}) {
  return useQuery({
    queryKey: queryKeys.bookings.mine(params),
    queryFn: () => bookingsService.getMine(params),
  });
}
