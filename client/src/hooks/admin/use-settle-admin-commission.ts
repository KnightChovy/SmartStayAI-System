import { useMutation, useQueryClient } from '@tanstack/react-query';

import { adminService } from '@/services/admin.service';

export function useSettleAdminCommission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (commissionId: string) =>
      adminService.settleCommission(commissionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'commissions'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'overview'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'audit-logs'] });
    },
  });
}
