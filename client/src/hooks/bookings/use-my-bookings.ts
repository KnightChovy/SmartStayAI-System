import { useQuery } from '@tanstack/react-query';
import { bookingService } from '@/services/booking.service';
import { queryKeys } from '@/constants/queryKeys';
import type { MyBookingsParams } from '@/types/booking.types';

/**
 * Danh sách booking của tôi.
 *
 * `enabled`: endpoint bắt buộc đăng nhập, nên nơi có thể render cho khách vãng lai (vd trang
 * kết quả thanh toán — route công khai) phải tắt query; nếu không, 401 sẽ kích hoạt interceptor
 * refresh-token trong `lib/api.ts` một cách vô ích.
 */
export function useMyBookings(
  params: MyBookingsParams = {},
  { enabled = true }: { enabled?: boolean } = {}
) {
  return useQuery({
    queryKey: queryKeys.bookings.mine(params),
    queryFn: () => bookingService.getMine(params),
    enabled,
  });
}
