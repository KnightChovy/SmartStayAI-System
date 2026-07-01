import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/constants/queryKeys';
import { staffService } from '@/services/staff.service';

/** `GET /hotels/:hotelId/conversations/:conversationId` — chi tiết + toàn bộ messages. */
export function useConversation(hotelId: string, conversationId: string) {
  return useQuery({
    queryKey: queryKeys.staff.conversation(hotelId, conversationId),
    queryFn: () => staffService.getConversation(hotelId, conversationId),
    enabled: !!hotelId && !!conversationId,
  });
}
