import { useMutation } from '@tanstack/react-query';
import { chatbotService } from '@/services/chatbot.service';
import type {
  SendChatMessageDto,
  SendChatMessageStreamHandlers,
} from '@/types/chatbot.type';

interface SendMessageStreamArgs {
  payload: SendChatMessageDto;
  handlers?: SendChatMessageStreamHandlers;
}

/**
 * `POST /conversations/messages/stream` — gửi tin nhắn dạng SSE.
 * `handlers.onChunk` được gọi mỗi mẩu chữ để render realtime; `data`/reply đầy đủ
 * trả về khi stream kết thúc.
 */
export function useSendMessageStream() {
  return useMutation({
    mutationFn: ({ payload, handlers }: SendMessageStreamArgs) =>
      chatbotService.sendMessageStream(payload, handlers),
  });
}
