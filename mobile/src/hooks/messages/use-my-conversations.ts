import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/constants/queryKeys';
import { messagesService } from '@/services/messages.service';
import { useAuthStore } from '@/stores/authStore';

/**
 * `GET /conversations/mine` — danh sách hội thoại của tôi.
 * Tự tắt khi chưa đăng nhập (BE trả `[]` cho ẩn danh nhưng khỏi gọi thừa).
 */
export function useMyConversations() {
  const isAuthed = useAuthStore((s) => Boolean(s.user?.id));
  return useQuery({
    queryKey: queryKeys.messages.mine(),
    queryFn: () => messagesService.listMine(),
    enabled: isAuthed,
    refetchOnWindowFocus: true,
  });
}
