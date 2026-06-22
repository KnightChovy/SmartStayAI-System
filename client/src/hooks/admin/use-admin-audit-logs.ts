import { useQuery } from '@tanstack/react-query';

import { adminKeys } from '@/hooks/admin/keys';
import { adminService } from '@/services/admin.service';
import type { AdminAuditLogsParams } from '@/types/admin.types';

export function useAdminAuditLogs(params: AdminAuditLogsParams = {}) {
  return useQuery({
    queryKey: adminKeys.auditLogs(params),
    queryFn: () => adminService.listAuditLogs(params),
  });
}
