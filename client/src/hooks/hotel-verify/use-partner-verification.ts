import { useMemo } from 'react';
import { useGetApplications } from './use-get-applications';

/**
 * Trạng thái xác minh khách sạn của partner đang đăng nhập, suy ra từ danh sách hồ sơ
 * (`GET /hotel-partners/registrations/me`):
 * - `none`     — chưa nộp hồ sơ nào
 * - `pending`  — có hồ sơ đang chờ duyệt / đang xét, chưa có hồ sơ được duyệt
 * - `rejected` — chỉ có hồ sơ bị từ chối
 * - `verified` — có ít nhất một hồ sơ đã được duyệt
 */
export type PartnerVerificationState = 'none' | 'pending' | 'rejected' | 'verified';

export function usePartnerVerification() {
  const { data, isLoading, isError, refetch } = useGetApplications();

  const state = useMemo<PartnerVerificationState>(() => {
    const apps = data ?? [];
    if (apps.length === 0) return 'none';
    if (apps.some(a => a.status === 'approved')) return 'verified';
    if (apps.some(a => a.status === 'pending' || a.status === 'in_review')) return 'pending';
    return 'rejected';
  }, [data]);

  return {
    state,
    isVerified: state === 'verified',
    isLoading,
    isError,
    refetch,
  };
}
