import { useEffect, useRef } from 'react';

import { getSocket } from '@/lib/socket';
import type { ConversationEscalatedEvent } from '@/types/staff-conversation.types';

interface UseHotelInboxSocketOptions {
  /** Khách sạn đang trực. `undefined` ⇒ hook không làm gì. */
  hotelId?: string;
  /** Gọi khi một hội thoại vừa được chuyển cho người thật (khách bấm "Gặp nhân viên" hoặc AI tự bàn giao). */
  onEscalated: (event: ConversationEscalatedEvent) => void;
}

/**
 * Nghe hộp thư của MỘT khách sạn qua Socket.IO — việc mới nổi lên ngay, không cần refresh.
 *
 * Khác `useConversationSocket` (room của một hội thoại, nhận `message:new`): hook này vào room
 * `hotel:<id>` để nhận `conversation:escalated`. BE chỉ cho join khi nhân viên có quyền ở KS đó.
 */
export function useHotelInboxSocket({
  hotelId,
  onEscalated,
}: UseHotelInboxSocketOptions): void {
  // Giữ callback trong ref để component tạo hàm mới mỗi render không làm rời/vào lại room liên tục.
  const onEscalatedRef = useRef(onEscalated);
  useEffect(() => {
    onEscalatedRef.current = onEscalated;
  }, [onEscalated]);

  useEffect(() => {
    if (!hotelId) return;

    const socket = getSocket();
    const handleEscalated = (event: ConversationEscalatedEvent) =>
      onEscalatedRef.current(event);

    const join = () => socket.emit('hotel:join', hotelId);

    join();
    // Join lại sau mỗi lần reconnect — room không được khôi phục tự động (xem useConversationSocket).
    socket.on('connect', join);
    socket.on('conversation:escalated', handleEscalated);

    // Socket dùng chung cả app nên chỉ gỡ listener, không disconnect.
    // BE không có handler 'hotel:leave'; đổi KS thì kết nối cũ tự hết hiệu lực khi socket đóng.
    return () => {
      socket.off('connect', join);
      socket.off('conversation:escalated', handleEscalated);
    };
  }, [hotelId]);
}
