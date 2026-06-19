import { useQuery } from '@tanstack/react-query';
import { staffService } from '@/services/staff.service';
import type { HotelBookingsParams } from '@/types/staff.types';
import { staffKeys } from './keys';

/** Booking list for the active hotel (front desk). */
export function useHotelBookings(hotelId: string | undefined, params: HotelBookingsParams = {}) {
  return useQuery({
    queryKey: staffKeys.bookings(hotelId ?? '', params),
    queryFn: () => staffService.listBookings(hotelId as string, params),
    enabled: Boolean(hotelId),
  });
}
