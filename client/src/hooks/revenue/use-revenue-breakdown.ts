import { useQuery } from '@tanstack/react-query';

import { revenueKeys } from '@/hooks/revenue/keys';
import { revenueService } from '@/services/revenue.service';
import type { RevenueBreakdownParams } from '@/types/revenue.types';

/** Tỷ trọng doanh thu theo khu vực/loại hình (`GET /platform-manager/revenue/breakdown`). */
export function useRevenueBreakdown(params: RevenueBreakdownParams) {
  return useQuery({
    queryKey: revenueKeys.breakdown(params),
    queryFn: () => revenueService.getBreakdown(params),
  });
}
