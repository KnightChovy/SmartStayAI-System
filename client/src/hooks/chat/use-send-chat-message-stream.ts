import { useMutation } from '@tanstack/react-query';

import { chatService } from '@/services/chat.service';
import type { SendChatMessageStreamPayload } from '@/types/chat.types';

export function useSendChatMessageStream() {
  return useMutation({
    mutationFn: ({ payload, handlers }: SendChatMessageStreamPayload) =>
      chatService.sendHotelMessageStream(payload, handlers),
  });
}
