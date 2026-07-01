import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/constants/queryKeys';
import { staffService } from '@/services/staff.service';
import type { ConversationsParams } from '@/types/staff.type';

/** `GET /hotels/:hotelId/conversations` — danh sách hội thoại inbox (S04). */
export function useConversations(hotelId: string, params: ConversationsParams = {}) {
  return useQuery({
    queryKey: queryKeys.staff.conversations(hotelId, params),
    queryFn: () => staffService.listConversations(hotelId, params),
    enabled: !!hotelId,
  });
}
