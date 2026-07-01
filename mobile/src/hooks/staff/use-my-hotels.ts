import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/constants/queryKeys';
import { staffService } from '@/services/staff.service';

/**
 * `GET /hotels/me/assignments` — danh sách KS staff đang đăng nhập được phân công.
 * Dùng để app tự xác định `hotelId` vận hành ngay sau khi login (xem `(staff)/_layout`).
 */
export function useMyStaffHotels(enabled = true) {
  return useQuery({
    queryKey: queryKeys.staff.myHotels(),
    queryFn: () => staffService.listMyHotels(),
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}
