import { useMutation, useQueryClient } from '@tanstack/react-query';
import { hotelService } from '@/services/hotel.service';
import { queryKeys } from '@/constants/queryKeys';
import type { AddHotelImagesDto } from '@/types/hotel.types';

/** `POST /hotels/:id/images` — thêm ảnh khách sạn. Làm mới chi tiết quản lý. */
export function useAddHotelImages(hotelId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: AddHotelImagesDto) => hotelService.addImages(hotelId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.hotels.managed(hotelId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.hotels.mine });
    },
  });
}
