import { useQuery } from '@tanstack/react-query';
import { staffService } from '@/services/staff.service';
import type { StaffRoomsParams } from '@/types/staff.types';
import { staffKeys } from './keys';
import type { StaffLiveOptions } from './live';

/**
 * Physical room list for the hotel (room status map).
 *
 * Mặc định xin `limit: 200` — trần của BE. Gọi trần như trước (BE mặc định 50 phòng/trang) là khách
 * sạn lớn bị cắt phòng trong im lặng: bản đồ phòng hiện thiếu, và mọi phép đếm dựa trên nó đều sai.
 */
export function useHotelRooms(
  hotelId: string | undefined,
  params: StaffRoomsParams = {},
  options: StaffLiveOptions = {}
) {
  const query: StaffRoomsParams = { limit: 200, ...params };
  return useQuery({
    queryKey: staffKeys.rooms(hotelId ?? '', query),
    queryFn: async () => {
      const page = await staffService.listRooms(hotelId as string, query);
      return page.results;
    },
    enabled: Boolean(hotelId),
    ...options,
  });
}
