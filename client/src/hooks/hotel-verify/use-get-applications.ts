import { useQuery } from '@tanstack/react-query';
import { hotelVerifyService } from '@/services/hotel-verify.service';
import { hotelVerifyKeys } from './keys';

export function useGetApplications() {
  return useQuery({
    queryKey: hotelVerifyKeys.applications(),
    queryFn: hotelVerifyService.getApplications,
  });
}
