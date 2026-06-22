import { useMutation, useQueryClient } from '@tanstack/react-query';
import { hotelVerifyService } from '@/services/hotel-verify.service';
import type { HotelRegistrationRequest } from '@/types/hotel-verify.types';
import { hotelVerifyKeys } from './keys';

export function useSubmitRegistration() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: HotelRegistrationRequest) => hotelVerifyService.submitRegistration(data),
    onSuccess: (data) => {
      if (data?.id) {
        queryClient.invalidateQueries({ queryKey: hotelVerifyKeys.application(data.id) });
      }
      queryClient.invalidateQueries({ queryKey: hotelVerifyKeys.applications() });
    },
  });
}
