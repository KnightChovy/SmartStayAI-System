import { useMutation, useQueryClient } from '@tanstack/react-query';
import { hotelService } from '@/services/hotel.service';
import { queryKeys } from '@/constants/queryKeys';
import type { UpdateHotelDto } from '@/types/hotel.types';

/**
 * `PATCH /hotels/:id` — partner cập nhật hồ sơ khách sạn.
 * Làm mới chi tiết quản lý của KS đó và danh sách KS của partner.
 */
export function useUpdateHotel(hotelId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: UpdateHotelDto) => hotelService.update(hotelId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.hotels.managed(hotelId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.hotels.mine });
    },
  });
}
