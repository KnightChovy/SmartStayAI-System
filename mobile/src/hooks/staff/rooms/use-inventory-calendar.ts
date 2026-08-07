import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/constants/queryKeys';
import { staffService } from '@/services/staff.service';

/** `GET /hotels/:hotelId/inventory/calendar` — số phòng còn bán được theo loại phòng, cho một
 *  khoảng ngày (`from`/`to` trùng nhau để hỏi đúng 1 đêm). */
export function useInventoryCalendar(hotelId: string, from: string, to: string) {
  return useQuery({
    queryKey: queryKeys.staff.inventoryCalendar(hotelId, from, to),
    queryFn: () => staffService.getInventoryCalendar(hotelId, from, to),
    enabled: !!hotelId && !!from && !!to,
  });
}
