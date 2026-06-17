import { useQuery } from '@tanstack/react-query';
import { staffService } from '@/services/staff.service';
import { staffKeys } from './keys';

/** Chi tiết một booking của khách sạn (cho màn lễ tân). */
export function useHotelBooking(hotelId: string | undefined, bookingId: string | undefined) {
  return useQuery({
    queryKey: staffKeys.booking(hotelId ?? '', bookingId ?? ''),
    queryFn: () => staffService.getBooking(hotelId as string, bookingId as string),
    enabled: Boolean(hotelId && bookingId),
  });
}
