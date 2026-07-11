import { useMutation, useQueryClient } from '@tanstack/react-query';

import { adminKeys } from '@/hooks/admin/keys';
import { adminService } from '@/services/admin.service';
import type { AdminUpdateUserPayload } from '@/types/admin.types';

interface UpdateAdminUserVariables {
  userId: string;
  payload: AdminUpdateUserPayload;
}

export function useUpdateAdminUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, payload }: UpdateAdminUserVariables) =>
      adminService.updateUser(userId, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({
        queryKey: adminKeys.user(variables.userId),
      });
    },
  });
}
