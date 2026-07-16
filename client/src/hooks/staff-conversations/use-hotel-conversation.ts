import { useQuery } from '@tanstack/react-query';

import { staffConversationService } from '@/services/staff-conversation.service';
import { staffConversationKeys } from './keys';

/** `GET /hotels/:hotelId/conversations/:conversationId` — chi tiết + toàn bộ tin nhắn. */
export function useHotelConversation(
  hotelId: string | undefined,
  conversationId: string | undefined
) {
  return useQuery({
    queryKey: staffConversationKeys.detail(hotelId ?? '', conversationId ?? ''),
    queryFn: () =>
      staffConversationService.get(hotelId as string, conversationId as string),
    enabled: Boolean(hotelId && conversationId),
  });
}
