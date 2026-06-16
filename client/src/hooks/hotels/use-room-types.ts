import { useQuery } from '@tanstack/react-query';
import { hotelService } from '@/services/hotel.service';
import { queryKeys } from '@/constants/queryKeys';
import type { RoomTypeParams } from '@/types/hotel.types';

/** Query loại phòng của một khách sạn (kèm tồn kho nếu có khoảng ngày). */
export function useRoomTypes(hotelId: string, params: RoomTypeParams = {}) {
  return useQuery({
    queryKey: queryKeys.hotels.roomTypes(hotelId, params),
    queryFn: () => hotelService.getRoomTypes(hotelId, params),
    enabled: !!hotelId,
  });
}
