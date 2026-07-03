import { useMutation, useQueryClient } from '@tanstack/react-query';

import { adminKeys } from '@/hooks/admin/keys';
import { adminService } from '@/services/admin.service';
import type { AdminUpdateUserRolePayload } from '@/types/admin.types';

interface UpdateAdminUserRoleVariables {
  userId: string;
  payload: AdminUpdateUserRolePayload;
}

export function useUpdateAdminUserRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, payload }: UpdateAdminUserRoleVariables) =>
      adminService.updateUserRole(userId, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({
        queryKey: adminKeys.user(variables.userId),
      });
    },
  });
}
