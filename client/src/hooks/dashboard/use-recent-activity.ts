import { useMemo } from 'react';
import { useAdminAuditLogs } from '@/hooks/admin';
import type { ActivityLog } from '@/types/dashboard.types';

const ACTIVITY_LIMIT = 6;

/**
 * Nhãn người-đọc-được cho `action` của audit log. BE lưu key thô (vd `commission.settle`);
 * đây là toàn bộ action đang thực sự được ghi (grep `auditService.log` ở server).
 * Action lạ (mới thêm ở BE) sẽ rơi vào fallback bên dưới thay vì hiện chuỗi rỗng.
 */
const ACTION_LABELS: Record<string, string> = {
  'commission.settle': 'settled the commission on',
  'hotel.update_flags': 'updated listing flags on',
  'user.set_status': 'changed the status of',
  'user.set_role': 'changed the role of',
};

const ENTITY_LABELS: Record<string, string> = {
  user: 'user',
  hotel: 'hotel',
  commission: 'commission',
};

/**
 * Nhật ký thao tác gần đây — `GET /admin/audit-logs?limit=6`.
 *
 * Lưu ý: audit log chỉ lưu `entityId` (uuid), KHÔNG lưu tên thực thể — muốn hiện
 * "Marriott Đà Nẵng" thì phải lookup thêm 1 request cho mỗi dòng. Nên `target` hiển thị
 * `<loại> <id rút gọn>`, đủ để đối chiếu mà không phải fan-out request.
 */
export function useRecentActivity() {
  const query = useAdminAuditLogs({ limit: ACTIVITY_LIMIT });

  const data = useMemo<ActivityLog[] | undefined>(() => {
    if (!query.data) return undefined;
    return query.data.results.map(log => ({
      id: log.id,
      actor: log.user?.fullName ?? log.user?.email ?? 'System',
      action: ACTION_LABELS[log.action] ?? log.action.replace(/[._]/g, ' '),
      target: `${ENTITY_LABELS[log.entityType] ?? log.entityType} ${log.entityId.slice(0, 8)}`,
      at: log.createdAt,
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
