import { useMutation } from '@tanstack/react-query';

import { chatService } from '@/services/chat.service';

/**
 * `PATCH /conversations/:conversationId/mode` — khách tự chọn nói chuyện với trợ lý AI hay với lễ tân.
 * Hội thoại giữ nguyên nên gạt qua lại không mất lịch sử.
 */
export function useSetConversationMode() {
  return useMutation({
    mutationFn: chatService.setConversationMode,
  });
}
