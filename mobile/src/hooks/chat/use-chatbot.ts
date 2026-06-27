import { useState, useCallback, useRef } from 'react';
import { chatbotService } from '@/services/chatbot.service';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  streaming?: boolean;
  error?: boolean;
}

export function useChatbot(hotelId = '') {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const conversationIdRef = useRef('');

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isStreaming) return;

    const userMsg: ChatMessage = {
      id: `u_${Date.now()}`,
      role: 'user',
      text: trimmed,
    };
    const aiMsgId = `a_${Date.now()}`;

    setMessages((prev) => [
      ...prev,
      userMsg,
      { id: aiMsgId, role: 'assistant', text: '', streaming: true },
    ]);
    setIsStreaming(true);

    try {
      await chatbotService.sendMessageStream(
        {
          message: trimmed,
          // Chỉ gửi khi có giá trị — backend từ chối chuỗi rỗng.
          ...(hotelId ? { hotelId } : {}),
          ...(conversationIdRef.current ? { conversationId: conversationIdRef.current } : {}),
        },
        {
          onConversationId: (id) => { conversationIdRef.current = id; },
          onChunk: (_chunk, fullText) => {
            setMessages((prev) =>
              prev.map((m) => (m.id === aiMsgId ? { ...m, text: fullText } : m)),
            );
          },
        },
      );
      setMessages((prev) =>
        prev.map((m) => (m.id === aiMsgId ? { ...m, streaming: false } : m)),
      );
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === aiMsgId
            ? { ...m, text: 'Xin lỗi, có lỗi xảy ra. Vui lòng thử lại.', streaming: false, error: true }
            : m,
        ),
      );
    } finally {
      setIsStreaming(false);
    }
  }, [hotelId, isStreaming]);

  const clearChat = useCallback(() => {
    setMessages([]);
    conversationIdRef.current = '';
  }, []);

  return { messages, sendMessage, isStreaming, clearChat };
}
