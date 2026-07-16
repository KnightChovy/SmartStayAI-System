import { useMutation, useQueryClient } from '@tanstack/react-query';

import { staffConversationService } from '@/services/staff-conversation.service';
import { staffConversationKeys } from './keys';

/** `POST /hotels/:hotelId/conversations/:conversationId/resolve` — đánh dấu đã xử lý xong. */
export function useResolveConversation(hotelId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (conversationId: string) =>
      staffConversationService.resolve(hotelId as string, conversationId),
    onSuccess: (_conversation, conversationId) => {
      queryClient.invalidateQueries({
        queryKey: staffConversationKeys.detail(hotelId ?? '', conversationId),
      });
      queryClient.invalidateQueries({
        queryKey: staffConversationKeys.lists(hotelId ?? ''),
      });
    },
  });
}
