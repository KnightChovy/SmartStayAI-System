import { useQuery } from '@tanstack/react-query';
import { dashboardKeys } from '@/hooks/dashboard/keys';
import { adminService } from '@/services/admin.service';
import { platformManagerService } from '@/services/platform-manager.service';
import type { DashboardSearchResults } from '@/types/dashboard.types';

const SEARCH_LIMIT = 5;

/**
 * Global search phân nhóm (hotels / users / bookings). Chỉ chạy khi query ≥ 2 ký tự.
 *
 * Gộp 3 endpoint thật trong MỘT query (thay vì 3 hook rời) để cả 3 nhóm cùng loading/lỗi
 * theo một nhịp — palette hiện nửa vời sẽ khó đọc hơn là chờ đủ:
 *   • `GET /admin/hotels?search=`            (khớp name hoặc city)
 *   • `GET /users?name=`                      (BE CHỈ tìm theo tên — không có tìm theo email)
 *   • `GET /platform-manager/bookings?search=` (khớp mã booking / tên / email khách)
 *
 * Platform Manager có đủ 3 quyền `manageHotels` + `getUsers` + `viewPlatformStats`.
 */
export function useDashboardSearch(query: string) {
  const q = query.trim();

  return useQuery<DashboardSearchResults>({
    queryKey: dashboardKeys.search(q),
    queryFn: async () => {
      const [hotels, users, bookings] = await Promise.all([
        adminService.listHotels({ search: q, limit: SEARCH_LIMIT }),
        adminService.listUsers({ name: q, limit: SEARCH_LIMIT }),
        platformManagerService.listBookings({ search: q, limit: SEARCH_LIMIT }),
      ]);

      return {
        hotels: hotels.results.map(h => ({ id: h.id, name: h.name, city: h.city })),
        users: users.results.map(u => ({
          id: u.id,
          name: u.fullName ?? u.name ?? u.email,
          email: u.email,
        })),
        bookings: bookings.results.map(b => ({
          id: b.id,
          code: b.bookingCode,
          hotelName: b.hotel.name,
        })),
      };
    },
    enabled: q.length >= 2,
  });
}
