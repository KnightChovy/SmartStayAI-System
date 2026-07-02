import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { revenueKeys } from '@/hooks/revenue/keys';
import { revenueService } from '@/services/revenue.service';
import type { RevenueByPartnerParams } from '@/types/revenue.types';

/** Bảng ranking đối tác theo doanh thu (`GET /platform-manager/revenue/by-partner`). */
export function useRevenueByPartner(params: RevenueByPartnerParams) {
  return useQuery({
    queryKey: revenueKeys.byPartner(params),
    queryFn: () => revenueService.getByPartner(params),
    // Giữ dữ liệu trang cũ khi đổi page/sort/filter để bảng không nhấp nháy (no layout shift).
    placeholderData: keepPreviousData,
  });
}
