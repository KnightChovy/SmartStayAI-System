import { useMutation } from '@tanstack/react-query';
import { chatbotService } from '@/services/chatbot.service';
import type { SendChatMessageDto } from '@/types/chatbot.type';

/** `POST /conversations/messages` — gửi tin nhắn, nhận trả lời đầy đủ (non-stream). */
export function useSendMessage() {
  return useMutation({
    mutationFn: (payload: SendChatMessageDto) => chatbotService.sendMessage(payload),
  });
}
