import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/constants/queryKeys';
import { messagesService } from '@/services/messages.service';
import type { SendMessagePayload } from '@/types/messages.type';

/**
 * `POST /conversations/messages` — gửi tin trong 1 hội thoại khách sạn.
 * Sau khi gửi, làm mới thread (BE đã lưu tin của guest + trả lời bot/nhân viên) và
 * danh sách hội thoại (đổi lastMessage/thời gian).
 */
export function useSendMessage(hotelId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: SendMessagePayload) => messagesService.sendMessage(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.messages.thread(hotelId || null) });
      queryClient.invalidateQueries({ queryKey: queryKeys.messages.mine() });
    },
  });
}
