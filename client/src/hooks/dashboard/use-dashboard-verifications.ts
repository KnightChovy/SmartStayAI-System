import { useMemo } from 'react';
import { useListRegistrations } from '@/hooks/manager/useManagerVerification';
import type { DashboardVerification } from '@/types/dashboard.types';

const RECENT_LIMIT = 5;

/**
 * Hồ sơ xác minh mới nhất — `GET /hotel-partners/registrations?sortBy=submittedAt:desc`.
 *
 * KHÔNG nhận date-range: endpoint này của BE không có bộ lọc theo ngày, nên danh sách luôn là
 * "N hồ sơ mới nhất" bất kể khoảng thời gian đang chọn trên dashboard.
 */
export function useDashboardVerifications() {
  const query = useListRegistrations({ sortBy: 'submittedAt:desc', limit: RECENT_LIMIT });

  const data = useMemo<DashboardVerification[] | undefined>(() => {
    if (!query.data) return undefined;
    return query.data.results.map(r => ({
      id: r.id,
      hotelId: r.hotelId,
      hotelName: r.hotel.name,
      partnerName: r.partner.businessName,
      submittedAt: r.submittedAt,
      status: r.status,
    }));
  }, [query.data]);

  return {
    data,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: () => {
      void query.refetch();
    },
  };
}
