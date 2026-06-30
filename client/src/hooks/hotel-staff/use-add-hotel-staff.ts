import { useMutation, useQueryClient } from '@tanstack/react-query';
import { hotelStaffService } from '@/services/hotel-staff.service';
import type { AddStaffDto } from '@/types/hotel-staff.types';
import { hotelStaffKeys } from './keys';

/** POST /hotels/:hotelId/staff — tạo tài khoản + gán nhân viên cho khách sạn. */
export function useAddHotelStaff(hotelId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: AddStaffDto) => hotelStaffService.add(hotelId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: hotelStaffKeys.list(hotelId) });
    },
  });
}
