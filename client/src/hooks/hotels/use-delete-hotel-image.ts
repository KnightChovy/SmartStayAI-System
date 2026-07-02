import { useMutation, useQueryClient } from '@tanstack/react-query';
import { hotelService } from '@/services/hotel.service';
import { queryKeys } from '@/constants/queryKeys';

/** `DELETE /hotels/:id/images/:imageId` — xoá một ảnh khách sạn. */
export function useDeleteHotelImage(hotelId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (imageId: string) => hotelService.deleteImage(hotelId, imageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.hotels.managed(hotelId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.hotels.mine });
    },
  });
}
