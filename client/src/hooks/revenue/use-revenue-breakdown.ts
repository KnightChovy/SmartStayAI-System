import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { revenueKeys } from '@/hooks/revenue/keys';
import { adminService } from '@/services/admin.service';
import type { AdminRevenueBreakdownParams } from '@/types/admin.types';

/**
 * `GET /admin/revenue/breakdown` — doanh thu chi tiết theo đối tác / khách sạn / thành phố.
 *
 * Gọi THẲNG `adminService`, không đi qua `revenueService` như hai hook cùng thư mục: hai hook
 * kia cần lớp map vì phải đổi shape và lấp bucket rỗng cho chart, còn response ở đây đã đúng
 * hình dạng UI cần — thêm một hàm chuyển tiếp chỉ là tầng gián tiếp không làm gì.
 *
 * `placeholderData` giữ trang cũ khi đổi groupBy/sort/page để bảng không nhấp nháy.
 */
export function useRevenueBreakdown(params: AdminRevenueBreakdownParams) {
  return useQuery({
    queryKey: revenueKeys.breakdown(params),
    queryFn: () => adminService.getRevenueBreakdown(params),
    placeholderData: keepPreviousData,
  });
}
