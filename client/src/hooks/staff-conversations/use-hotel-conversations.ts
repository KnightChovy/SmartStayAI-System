import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { staffConversationService } from '@/services/staff-conversation.service';
import type { StaffConversationsParams } from '@/types/staff-conversation.types';
import { staffConversationKeys } from './keys';

/** `GET /hotels/:hotelId/conversations` — danh sách hội thoại của KS đang trực. */
export function useHotelConversations(
  hotelId: string | undefined,
  params: StaffConversationsParams = {}
) {
  return useQuery({
    queryKey: staffConversationKeys.list(hotelId ?? '', params),
    queryFn: () => staffConversationService.list(hotelId as string, params),
    enabled: Boolean(hotelId),
    // Đổi filter không làm danh sách chớp về skeleton rồi nhảy layout.
    placeholderData: keepPreviousData,
  });
}
