import { useMutation, useQueryClient } from '@tanstack/react-query';

import { adminKeys } from '@/hooks/admin/keys';
import { adminService } from '@/services/admin.service';
import type { AdminUpdateUserStatusPayload } from '@/types/admin.types';

interface UpdateAdminUserStatusVariables {
  userId: string;
  payload: AdminUpdateUserStatusPayload;
}

export function useUpdateAdminUserStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, payload }: UpdateAdminUserStatusVariables) =>
      adminService.updateUserStatus(userId, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({
        queryKey: adminKeys.user(variables.userId),
      });
    },
  });
}
