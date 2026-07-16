import { useQuery } from '@tanstack/react-query';

import { chatService } from '@/services/chat.service';

interface UseMyConversationOptions {
  /**
   * Ghi đè điều kiện chạy query. Mặc định `Boolean(hotelId)` — hợp với chat theo KS (chưa chọn KS
   * thì đừng gọi). Chế độ TOÀN SÀN cố ý KHÔNG có `hotelId` nên bắt buộc phải truyền `enabled`
   * (thường là trạng thái đăng nhập), nếu không query sẽ không bao giờ chạy.
   */
  enabled?: boolean;
}

/**
 * `GET /conversations/me?hotelId=` — hội thoại đang mở của khách + lịch sử.
 * Bỏ trống `hotelId` = hội thoại TOÀN SÀN (khung chat nổi); truyền vào = hội thoại với KS đó.
 * Khung chat dùng để khôi phục lại sau khi F5, nhờ đó join lại được room socket và nhận tiếp câu
 * trả lời của lễ tân.
 */
export function useMyConversation(
  hotelId: string | undefined,
  options?: UseMyConversationOptions
) {
  return useQuery({
    // `?? null` để hội thoại toàn sàn có khoá cache riêng, không lẫn với "chưa chọn KS".
    queryKey: ['chat', 'my-conversation', hotelId ?? null] as const,
    queryFn: () => chatService.getMyConversation(hotelId),
    enabled: options?.enabled ?? Boolean(hotelId),
  });
}
