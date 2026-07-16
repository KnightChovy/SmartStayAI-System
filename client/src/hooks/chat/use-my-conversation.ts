import { useQuery } from '@tanstack/react-query';

import { chatService } from '@/services/chat.service';

/**
 * `GET /conversations/me?hotelId=` — hội thoại đang mở của khách ở một KS + lịch sử.
 * Khung chat dùng để khôi phục lại sau khi F5, nhờ đó join lại được room socket và nhận tiếp câu
 * trả lời của lễ tân.
 */
export function useMyConversation(hotelId: string | undefined) {
  return useQuery({
    queryKey: ['chat', 'my-conversation', hotelId] as const,
    queryFn: () => chatService.getMyConversation(hotelId as string),
    enabled: Boolean(hotelId),
  });
}
