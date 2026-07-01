import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/constants/queryKeys';
import { staffService } from '@/services/staff.service';

/** `POST /hotels/:hotelId/conversations/:conversationId/resolve` — đánh dấu đã xử lý. */
export function useResolveConversation(hotelId: string, conversationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => staffService.resolveConversation(hotelId, conversationId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.staff.conversation(hotelId, conversationId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.staff.all() });
    },
  });
}
