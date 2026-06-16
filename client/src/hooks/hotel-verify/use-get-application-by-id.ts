import { useQuery } from '@tanstack/react-query';
import { hotelVerifyService } from '@/services/hotel-verify.service';
import { hotelVerifyKeys } from './keys';

export function useGetApplicationById(id: string | null) {
  return useQuery({
    queryKey: hotelVerifyKeys.application(id!),
    queryFn: () => hotelVerifyService.getApplicationById(id!),
    enabled: !!id,
  });
}
