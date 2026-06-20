import { useMutation } from '@tanstack/react-query';

import { chatService } from '@/services/chat.service';

export function useSendChatMessage() {
  return useMutation({
    mutationFn: chatService.sendHotelMessage,
  });
}
