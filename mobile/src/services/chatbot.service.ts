// `expo/fetch` (WinterCG) hỗ trợ streaming body trên RN — fetch mặc định của RN thì KHÔNG.
import { fetch as expoFetch } from 'expo/fetch';
import { api, API_BASE_URL } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import type {
  SendChatMessageDto,
  SendChatMessageResponse,
  SendChatMessageStreamHandlers,
} from '@/types/chatbot.type';

/** Đọc một SSE frame ("event:" + "data:") thành { event, data }. */
function parseSseFrame(frame: string): { event: string; data: unknown } | null {
  let event = 'message';
  const dataLines: string[] = [];

  for (const line of frame.split(/\r?\n/)) {
    if (line.startsWith('event:')) event = line.slice('event:'.length).trim();
    if (line.startsWith('data:')) dataLines.push(line.slice('data:'.length).trimStart());
  }

  if (dataLines.length === 0) return null;
  const raw = dataLines.join('\n');
  try {
    return { event, data: JSON.parse(raw) };
  } catch {
    return { event, data: raw };
  }
}

function readString(data: unknown, key: string): string | undefined {
  if (data && typeof data === 'object' && key in data) {
    const value = (data as Record<string, unknown>)[key];
    return typeof value === 'string' ? value : undefined;
  }
  return undefined;
}

/** Tầng gọi API AI chatbot (`/v1/conversations`). Tất cả cần đăng nhập. */
export const chatbotService = {
  /** Gửi tin nhắn, nhận trả lời đầy đủ (`POST /conversations/messages`). */
  async sendMessage(payload: SendChatMessageDto): Promise<SendChatMessageResponse> {
    const { data } = await api.post<SendChatMessageResponse>(
      '/conversations/messages',
      payload
    );
    return data;
  },

  /**
   * Gửi tin nhắn dạng STREAM (SSE) (`POST /conversations/messages/stream`).
   * `handlers.onChunk` được gọi mỗi mẩu chữ; trả về reply đầy đủ khi xong.
   */
  async sendMessageStream(
    payload: SendChatMessageDto,
    handlers: SendChatMessageStreamHandlers = {}
  ): Promise<SendChatMessageResponse> {
    const token = useAuthStore.getState().accessToken;
    const response = await expoFetch(`${API_BASE_URL}/conversations/messages/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error((await response.text()) || 'Không kết nối được chatbot stream.');
    }
    if (!response.body) {
      throw new Error('Chatbot stream không trả về body đọc được.');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let reply = '';
    let conversationId = payload.conversationId ?? '';

    const handleFrame = (frame: string) => {
      const parsed = parseSseFrame(frame);
      if (!parsed) return;

      if (parsed.event === 'meta') {
        const next = readString(parsed.data, 'conversationId');
        if (next) {
          conversationId = next;
          handlers.onConversationId?.(next);
        }
        return;
      }
      if (parsed.event === 'chunk') {
        const chunk = readString(parsed.data, 'text');
        if (chunk) {
          reply += chunk;
          handlers.onChunk?.(chunk, reply);
        }
      }
    };

    for (;;) {
      const { done, value } = await reader.read();
      buffer += decoder.decode(value, { stream: !done });

      const frames = buffer.split(/\n\n/);
      buffer = frames.pop() ?? '';
      frames.forEach(handleFrame);

      if (done) {
        if (buffer.trim()) handleFrame(buffer);
        break;
      }
    }

    return { conversationId, reply };
  },
};
