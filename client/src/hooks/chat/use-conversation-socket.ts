import { useEffect, useRef } from 'react';

import { getSocket } from '@/lib/socket';
import type { ConversationSocketMessage } from '@/types/chat.types';

interface UseConversationSocketOptions {
  /** Hội thoại cần nghe. `undefined` = chưa có hội thoại nào ⇒ hook không làm gì. */
  conversationId?: string;
  /** Gọi mỗi khi có tin nhắn mới được đẩy về (chủ yếu là câu trả lời của lễ tân). */
  onMessage: (message: ConversationSocketMessage) => void;
}

/**
 * Nghe tin nhắn real-time của MỘT hội thoại qua Socket.IO.
 *
 * Gửi tin vẫn đi bằng REST — BE không có handler nhận tin qua socket; socket chỉ là kênh một chiều
 * server → client để câu trả lời của lễ tân về ngay mà khách không phải reload.
 */
export function useConversationSocket({
  conversationId,
  onMessage,
}: UseConversationSocketOptions): void {
  // Giữ callback trong ref để việc component tạo hàm mới mỗi lần render KHÔNG làm hook rời/vào lại
  // room liên tục (sẽ đánh rơi tin nhắn đến đúng lúc đang re-subscribe).
  const onMessageRef = useRef(onMessage);
  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    if (!conversationId) return;

    const socket = getSocket();
    const handleMessage = (message: ConversationSocketMessage) => {
      // Một socket dùng chung cho cả app ⇒ lọc theo hội thoại đang mở, tránh tin của hội thoại khác
      // lọt vào khung chat khi khách đổi khách sạn.
      if (message.conversationId !== conversationId) return;
      onMessageRef.current(message);
    };

    // Xin vào room. BE kiểm quyền khi join (đúng chủ hội thoại hoặc nhân viên của KS đó); không đủ
    // quyền thì lời xin bị bỏ qua im lặng và ta chỉ đơn giản không nhận được tin.
    const join = () => socket.emit('conversation:join', conversationId);

    join();
    // PHẢI join lại sau mỗi lần nối lại: socket.io tự reconnect nhưng room KHÔNG được khôi phục
    // (server cấp socket id mới ⇒ mọi room cũ mất sạch). Thiếu chỗ này thì chỉ cần mạng chớp một
    // nhịp — hoặc host free tier ngắt kết nối nhàn rỗi — là khung chat im lặng chết, không báo lỗi.
    socket.on('connect', join);
    socket.on('message:new', handleMessage);

    // Socket được dùng chung nên chỉ gỡ listener + rời room của MÌNH, không disconnect cả kết nối.
    return () => {
      socket.off('connect', join);
      socket.off('message:new', handleMessage);
      socket.emit('conversation:leave', conversationId);
    };
  }, [conversationId]);
}
