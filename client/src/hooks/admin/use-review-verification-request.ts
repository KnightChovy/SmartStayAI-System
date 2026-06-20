import { useMutation, useQueryClient } from '@tanstack/react-query';

import { adminService } from '@/services/admin.service';
import type { AdminReviewVerificationPayload } from '@/types/admin.types';

interface ReviewVerificationRequestVariables {
  requestId: string;
  payload: AdminReviewVerificationPayload;
}

export function useReviewVerificationRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ requestId, payload }: ReviewVerificationRequestVariables) =>
      adminService.reviewVerificationRequest(requestId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['admin', 'verification-requests'],
      });
    },
  });
}
