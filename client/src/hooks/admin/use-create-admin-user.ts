import { useMutation, useQueryClient } from '@tanstack/react-query';

import { adminService } from '@/services/admin.service';

export function useCreateAdminUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: adminService.createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });
}
