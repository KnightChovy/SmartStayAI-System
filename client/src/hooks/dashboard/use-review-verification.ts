import { useMutation, useQueryClient } from '@tanstack/react-query';
import { dashboardService } from '@/services/dashboard.service';

/** Approve/Reject nhanh một verification từ dashboard (mutation, invalidate list). */
export function useReviewVerification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, decision }: { id: string; decision: 'approve' | 'reject' }) =>
      decision === 'approve'
        ? dashboardService.approveVerification(id)
        : dashboardService.rejectVerification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'verifications'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'summary'] });
    },
  });
}
