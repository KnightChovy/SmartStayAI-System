import { useMutation, useQueryClient } from '@tanstack/react-query';
import { amenityService } from '@/services/amenity.service';
import { hotelManagementKeys } from './keys';

/** DELETE /amenities/:id — xoá tiện nghi (chỉ khi chưa được gán ở đâu). */
export function useDeleteAmenity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (amenityId: string) => amenityService.deleteAmenity(amenityId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...hotelManagementKeys.all, 'amenities'] });
    },
  });
}
