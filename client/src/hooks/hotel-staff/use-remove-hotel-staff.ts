import { useMutation, useQueryClient } from '@tanstack/react-query';
import { hotelStaffService } from '@/services/hotel-staff.service';
import { hotelStaffKeys } from './keys';

/** DELETE /hotels/:hotelId/staff/:userId — bỏ gán nhân viên khỏi khách sạn. */
export function useRemoveHotelStaff(hotelId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => hotelStaffService.remove(hotelId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: hotelStaffKeys.list(hotelId) });
    },
  });
}
