import { useMutation, useQueryClient } from '@tanstack/react-query';
import { hotelService } from '@/services/hotel.service';
import { queryKeys } from '@/constants/queryKeys';

/** `PATCH /hotels/:id/images/:imageId/primary` — đặt ảnh chính (clear cờ primary các ảnh khác). */
export function useSetPrimaryHotelImage(hotelId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (imageId: string) => hotelService.setPrimaryImage(hotelId, imageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.hotels.managed(hotelId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.hotels.mine });
    },
  });
}
