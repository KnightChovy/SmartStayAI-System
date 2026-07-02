import { useMutation, useQueryClient } from '@tanstack/react-query';
import { amenityService } from '@/services/amenity.service';
import type { UpdateAmenityDto } from '@/types/hotel.types';
import { hotelManagementKeys } from './keys';

/** PATCH /amenities/:id — cập nhật tiện nghi. Làm mới mọi query danh mục tiện nghi. */
export function useUpdateAmenity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ amenityId, dto }: { amenityId: string; dto: UpdateAmenityDto }) =>
      amenityService.updateAmenity(amenityId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...hotelManagementKeys.all, 'amenities'] });
    },
  });
}
