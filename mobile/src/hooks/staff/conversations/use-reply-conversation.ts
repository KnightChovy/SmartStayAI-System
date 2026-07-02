import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/constants/queryKeys';
import { staffService } from '@/services/staff.service';

/**
 * `POST /hotels/:hotelId/conversations/:conversationId/reply` — staff trả lời.
 * Làm mới chi tiết hội thoại (thêm message) và danh sách inbox (đổi status/assignee).
 */
export function useReplyConversation(hotelId: string, conversationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (message: string) =>
      staffService.replyConversation(hotelId, conversationId, { message }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.staff.conversation(hotelId, conversationId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.staff.all() });
    },
  });
}
