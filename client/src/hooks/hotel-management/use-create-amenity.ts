import { useMutation, useQueryClient } from '@tanstack/react-query';
import { amenityService } from '@/services/amenity.service';
import type { CreateAmenityDto } from '@/types/hotel.types';
import { hotelManagementKeys } from './keys';

/** POST /amenities — tạo tiện nghi mới vào catalog. Làm mới mọi query danh mục tiện nghi. */
export function useCreateAmenity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateAmenityDto) => amenityService.createAmenity(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...hotelManagementKeys.all, 'amenities'],
      });
    },
  });
}
