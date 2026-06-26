import { useQuery } from '@tanstack/react-query';
import { bookingService } from '@/services/booking.service';
import { bookingKeys } from './keys';

export function useMyBookings() {
  return useQuery({
    queryKey: bookingKeys.mine(),
    queryFn: bookingService.getMine,
  });
}
