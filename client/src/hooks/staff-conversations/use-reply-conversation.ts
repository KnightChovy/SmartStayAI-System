import { useMutation, useQueryClient } from '@tanstack/react-query';

import { staffConversationService } from '@/services/staff-conversation.service';
import type {
  ReplyConversationDto,
  StaffConversationDetail,
} from '@/types/staff-conversation.types';
import { staffConversationKeys } from './keys';

/** `POST /hotels/:hotelId/conversations/:conversationId/reply` — nhân viên trả lời khách. */
export function useReplyConversation(hotelId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: ReplyConversationDto) =>
      staffConversationService.reply(hotelId as string, dto),
    onSuccess: (saved, { conversationId }) => {
      // Ghi thẳng tin vừa lưu vào cache thay vì invalidate để refetch.
      //
      // BE cũng đẩy chính tin này qua socket ('message:new'), nên nếu vừa refetch vừa nhận socket thì
      // hai đường ghi đua nhau vào cùng một mảng — nguồn gốc của lỗi "gửi 1 tin hiện 2". Giờ cả hai
      // đường đều chạy qua đúng một hàm hợp nhất theo id nên lặp bao nhiêu lần cũng chỉ ra một tin.
      queryClient.setQueryData<StaffConversationDetail>(
        staffConversationKeys.detail(hotelId ?? '', conversationId),
        old => (old ? mergeMessage(old, saved) : old)
      );
      // Danh sách vẫn phải làm mới: dòng rời tab "Needs reply", preview + thứ tự đổi theo tin cuối.
      queryClient.invalidateQueries({
        queryKey: staffConversationKeys.lists(hotelId ?? ''),
      });
    },
  });
}

/**
 * Thêm một tin vào hội thoại, bỏ qua nếu id đã có. Dùng chung cho cả tin do chính nhân viên gửi
 * (response của mutation) lẫn tin đẩy về qua socket — hai nguồn, một phép ghi idempotent.
 */
export function mergeMessage(
  conversation: StaffConversationDetail,
  message: StaffConversationDetail['messages'][number]
): StaffConversationDetail {
  if (conversation.messages.some(item => item.id === message.id)) {
    return conversation;
  }
  return {
    ...conversation,
    messages: [...conversation.messages, message],
    lastMessageAt: message.createdAt,
  };
}
