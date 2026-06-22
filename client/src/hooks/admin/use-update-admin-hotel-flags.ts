import { useMutation, useQueryClient } from '@tanstack/react-query';

import { adminService } from '@/services/admin.service';
import type { AdminUpdateHotelFlagsPayload } from '@/types/admin.types';

interface UpdateAdminHotelFlagsVariables {
  hotelId: string;
  payload: AdminUpdateHotelFlagsPayload;
}

export function useUpdateAdminHotelFlags() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ hotelId, payload }: UpdateAdminHotelFlagsVariables) =>
      adminService.updateHotelFlags(hotelId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'hotels'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'overview'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'audit-logs'] });
    },
  });
}
