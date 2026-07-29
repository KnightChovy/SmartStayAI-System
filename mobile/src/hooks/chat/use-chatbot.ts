import { useState, useCallback, useEffect, useRef } from 'react';
import { chatbotService } from '@/services/chatbot.service';
import { chatOwnerKey, useChatStore } from '@/stores/chatStore';
import { useAuthStore } from '@/stores/authStore';
import type { ChatMessage, ChatSession } from '@/types/chatbot.type';

export type { ChatMessage, ChatSession };

/** Selector trả `[]` mới mỗi lần render sẽ trượt so sánh `Object.is` của zustand v5 → render vô hạn. */
const EMPTY_SESSIONS: ChatSession[] = [];

interface UseChatbotOptions {
  initialMessage?: ChatMessage;
}

export function useChatbot({ initialMessage }: UseChatbotOptions = {}) {
  const [messages, setMessages] = useState<ChatMessage[]>(() =>
    initialMessage ? [initialMessage] : [],
  );
  const [isStreaming, setIsStreaming] = useState(false);
  const conversationIdRef = useRef('');

  const userId = useAuthStore((state) => state.user?.id);
  const ownerKey = chatOwnerKey(userId);

  const hasHydrated = useChatStore((state) => state._hasHydrated);
  // Scalar: chỉ render lại khi ĐỔI đoạn chat, không phải mỗi lần tự lưu.
  const activeSessionId = useChatStore(
    (state) => state.owners[ownerKey]?.activeSessionId ?? null,
  );
  // Danh sách thì phải subscribe thật — drawer cần thấy tiêu đề/thời gian đổi theo.
  const sessions = useChatStore((state) => state.owners[ownerKey]?.sessions ?? EMPTY_SESSIONS);
  const saveMessages = useChatStore((state) => state.saveMessages);
  const setActiveSession = useChatStore((state) => state.setActiveSession);
  const renameSessionInStore = useChatStore((state) => state.renameSession);
  const deleteSessionInStore = useChatStore((state) => state.deleteSession);

  const restoredKeyRef = useRef<string | null>(null);
  const activeSessionRef = useRef<string | null>(null);

  // Nạp lại đoạn chat đang mở từ máy. Đọc thẳng `getState()` chứ không subscribe `owners` —
  // subscribe thì mỗi lần tự lưu sẽ kích hoạt lại effect này và ghi đè tin đang nhắn.
  // Một effect này phục vụ CẢ mở đoạn cũ lẫn tạo đoạn mới: cả hai chỉ đổi `activeSessionId`.
  useEffect(() => {
    if (!hasHydrated) return;
    const restoreKey = `${ownerKey}::${activeSessionId ?? 'new'}`;
    if (restoredKeyRef.current === restoreKey) return;
    restoredKeyRef.current = restoreKey;
    activeSessionRef.current = activeSessionId;

    const saved = activeSessionId
      ? useChatStore.getState().owners[ownerKey]?.sessions.find((s) => s.id === activeSessionId)
      : undefined;
    conversationIdRef.current = saved?.conversationId ?? '';
    // Lời chào dựng lại từ i18n hiện hành, lịch sử nối phía sau — giống cách widget web khôi phục.
    setMessages(
      saved?.messages.length
        ? [...(initialMessage ? [initialMessage] : []), ...saved.messages]
        : initialMessage
          ? [initialMessage]
          : [],
    );
  }, [hasHydrated, ownerKey, activeSessionId, initialMessage]);

  // Ghi xuống máy khi một lượt đã CHỐT. Cố tình không lưu giữa lúc stream: mỗi chunk SSE
  // (vài lần/giây) sẽ là một lần serialize + ghi AsyncStorage, vừa phí vừa giật khung chat.
  useEffect(() => {
    const sessionId = activeSessionRef.current;
    if (!hasHydrated || isStreaming || !sessionId) return;
    if (restoredKeyRef.current !== `${ownerKey}::${sessionId}`) return;
    const persistable = messages.filter((message) => message.id !== initialMessage?.id);
    if (!persistable.length) return;
    saveMessages(ownerKey, sessionId, persistable, conversationIdRef.current);
  }, [messages, isStreaming, hasHydrated, ownerKey, initialMessage?.id, saveMessages]);

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isStreaming) return;

    // Đoạn chat phải tồn tại NGAY lúc bấm gửi thì drawer mới thấy nó và các chunk sau mới biết
    // ghi vào đâu. Gán luôn `restoredKeyRef` TRƯỚC khi `activeSessionId` từ store lan về —
    // nếu không, effect khôi phục sẽ tưởng vừa đổi đoạn và ghi đè tin vừa gõ bằng bản rỗng.
    const sessionId = useChatStore.getState().ensureActiveSession(ownerKey);
    activeSessionRef.current = sessionId;
    restoredKeyRef.current = `${ownerKey}::${sessionId}`;

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
          // Không truyền hotelId: đây là trợ lý toàn sàn, đồng bộ với chatbox web.
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
  }, [isStreaming, ownerKey]);

  // Đổi đoạn giữa lượt stream sẽ khiến chunk đổ vào tin đã biến mất khỏi màn hình.
  const newChat = useCallback(() => {
    if (isStreaming) return;
    useChatStore.getState().createSession(ownerKey);
  }, [isStreaming, ownerKey]);

  const openSession = useCallback((sessionId: string) => {
    if (isStreaming || sessionId === activeSessionId) return;
    setActiveSession(ownerKey, sessionId);
  }, [isStreaming, activeSessionId, ownerKey, setActiveSession]);

  // Đổi tên chạy được cả khi đang stream: chỉ đụng `title`, không đua với effect lưu messages.
  const renameSession = useCallback((sessionId: string, title: string) => {
    renameSessionInStore(ownerKey, sessionId, title);
  }, [ownerKey, renameSessionInStore]);

  const deleteSession = useCallback((sessionId: string) => {
    deleteSessionInStore(ownerKey, sessionId);
  }, [ownerKey, deleteSessionInStore]);

  return {
    messages,
    sendMessage,
    isStreaming,
    sessions,
    activeSessionId,
    newChat,
    openSession,
    renameSession,
    deleteSession,
  };
}
