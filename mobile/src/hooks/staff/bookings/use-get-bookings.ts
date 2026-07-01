import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/constants/queryKeys';
import { staffService } from '@/services/staff.service';
import type { StaffBookingsParams } from '@/types/staff.type';

/** `GET /hotels/:hotelId/bookings` — danh sách booking của KS cho staff. */
export function useGetBookings(hotelId: string, params: StaffBookingsParams = {}) {
  return useQuery({
    queryKey: queryKeys.staff.bookings(hotelId, params),
    queryFn: () => staffService.listBookings(hotelId, params),
    enabled: !!hotelId,
  });
}
