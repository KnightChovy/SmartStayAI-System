import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/constants/queryKeys';
import { messagesService } from '@/services/messages.service';

/**
 * `GET /conversations/me?hotelId=` — hội thoại đang mở với 1 khách sạn + lịch sử tin.
 *
 * Không có Socket.IO trên mobile như bản web ⇒ dùng **polling** (`refetchInterval`)
 * để tin nhắn của nhân viên tự hiện khi màn đang mở.
 */
export function useMyConversation(hotelId: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.messages.thread(hotelId || null),
    queryFn: () => messagesService.getMine(hotelId || undefined),
    enabled: enabled && Boolean(hotelId),
    refetchInterval: 5000,
    refetchIntervalInBackground: false,
  });
}
