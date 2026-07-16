import { useQuery } from '@tanstack/react-query';

import { chatService } from '@/services/chat.service';

/**
 * `GET /conversations/mine` — các khách sạn khách đã nhắn, dựng thanh bên kiểu Messenger.
 * `enabled` theo trạng thái đăng nhập: BE không định danh được khách vãng lai nên sẽ trả mảng rỗng.
 */
export function useMyConversations(enabled: boolean) {
  return useQuery({
    queryKey: ['chat', 'my-conversations'] as const,
    queryFn: chatService.listMyConversations,
    enabled,
  });
}
