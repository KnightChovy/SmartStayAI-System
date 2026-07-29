import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/constants/queryKeys';
import { messagesService } from '@/services/messages.service';
import type { SetConversationModePayload } from '@/types/messages.type';

/**
 * `PATCH /conversations/:id/mode` — guest chuyển AI ⇄ nhân viên.
 * `mode='human'` sẽ escalate hội thoại tới nhân viên khách sạn.
 */
export function useSetConversationMode(hotelId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ conversationId, ...payload }: SetConversationModePayload & { conversationId: string }) =>
      messagesService.setMode(conversationId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.messages.thread(hotelId || null) });
      queryClient.invalidateQueries({ queryKey: queryKeys.messages.mine() });
    },
  });
}
