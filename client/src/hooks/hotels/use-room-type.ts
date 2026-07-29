import { useQuery } from '@tanstack/react-query';
import { hotelService } from '@/services/hotel.service';
import { queryKeys } from '@/constants/queryKeys';
import type { RoomTypeDetailParams } from '@/types/hotel.types';

/**
 * Chi tiết một loại phòng (`GET /hotels/:hotelId/room-types/:roomTypeId`) — public.
 *
 * BE bắt buộc `checkIn`/`checkOut` đi cùng nhau (Joi `.and`), gửi lẻ một cái là 400.
 * Nên chỉ đính khoảng ngày vào query khi có ĐỦ hai đầu — thiếu thì gọi không kèm ngày
 * (BE trả chi tiết phòng, không kèm tồn kho/giá kỳ ở) thay vì để request hỏng.
 */
export function useRoomType(
  hotelId: string | undefined,
  roomTypeId: string | undefined,
  params: RoomTypeDetailParams = {}
) {
  const hasStayRange = !!params.checkIn && !!params.checkOut;
  // Số khách gửi kèm cả khi không có ngày: BE dùng nó để lọc sức chứa, không phụ thuộc kỳ ở.
  const guestQuery =
    params.adults != null ? { adults: params.adults, children: params.children ?? 0 } : {};
  const query: RoomTypeDetailParams = hasStayRange
    ? { checkIn: params.checkIn, checkOut: params.checkOut, ...guestQuery }
    : guestQuery;

  return useQuery({
    queryKey: queryKeys.hotels.roomTypeDetail(hotelId ?? '', roomTypeId ?? '', query),
    queryFn: () => hotelService.getRoomTypeById(hotelId!, roomTypeId!, query),
    enabled: !!hotelId && !!roomTypeId,
  });
}
