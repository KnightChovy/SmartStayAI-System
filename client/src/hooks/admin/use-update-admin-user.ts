import { useMutation, useQueryClient } from '@tanstack/react-query';

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });
}
