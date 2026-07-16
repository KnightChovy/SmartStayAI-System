import { useListRegistrations } from '@/hooks/manager/useManagerVerification';

/**
 * Số hồ sơ xác minh đang chờ duyệt — `GET /hotel-partners/registrations?status=pending&limit=1`.
 *
 * Gọi riêng (thay vì đếm trên danh sách "5 hồ sơ mới nhất") để lấy ĐÚNG tổng số: `totalResults`
 * là tổng toàn bộ hàng đợi, không bị giới hạn bởi trang đang xem.
 */
export function usePendingVerificationsCount() {
  const query = useListRegistrations({ status: 'pending', limit: 1 });

  return {
    count: query.data?.totalResults ?? 0,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}
