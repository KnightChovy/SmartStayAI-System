import { hotelService } from './hotel.service';
import { API_BASE_URL, api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import type {
  ChatReply,
  ConversationHandoffState,
  ConversationStatus,
  MyConversationListItem,
  MyConversationResponse,
  SetConversationModeDto,
  SetConversationModeResponse,
  SendChatMessageDto,
  SendChatMessageResponse,
  SendChatMessageStreamHandlers,
} from '@/types/chat.types';

/**
 * [MOCK engine] Digital Concierge. Backend chưa có endpoint chatbot
 * (DB có `conversations`/`messages`), nên xử lý intent đơn giản ở client.
 * Điểm GROUNDED: khi nhận diện thành phố, gọi API THẬT `/hotels` để gợi ý
 * khách sạn có thật → bấm vào mở trang chi tiết.
 */

// Một số thành phố để dò trong câu hỏi của người dùng
const KNOWN_CITIES = [
  'Da Nang',
  'Đà Nẵng',
  'Ha Noi',
  'Hà Nội',
  'Hanoi',
  'Ho Chi Minh',
  'Hồ Chí Minh',
  'Saigon',
  'Hoi An',
  'Hội An',
  'Da Lat',
  'Đà Lạt',
  'Dalat',
  'Nha Trang',
  'Phu Quoc',
  'Phú Quốc',
  'Ha Long',
  'Hạ Long',
  'Hue',
  'Huế',
  'Vung Tau',
  'Vũng Tàu',
  'Sapa',
  'Sa Pa',
];

const DEFAULT_QUICK_REPLIES = [
  'Stays in Da Nang',
  'Weekend deals',
  'My loyalty points',
];

function detectCity(text: string): string | null {
  const lower = text.toLowerCase();
  const match = KNOWN_CITIES.find(c => lower.includes(c.toLowerCase()));
  return match ?? null;
}

function readSseJson(frame: string): { event: string; data: unknown } | null {
  let event = 'message';
  const dataLines: string[] = [];

  frame.split(/\r?\n/).forEach(line => {
    if (line.startsWith('event:')) {
      event = line.slice('event:'.length).trim();
    }
    if (line.startsWith('data:')) {
      dataLines.push(line.slice('data:'.length).trimStart());
    }
  });

  if (dataLines.length === 0) {
    return null;
  }

  const rawData = dataLines.join('\n');
  try {
    return { event, data: JSON.parse(rawData) };
  } catch {
    return { event, data: rawData };
  }
}

function pickStreamText(data: unknown): string {
  if (data && typeof data === 'object' && 'text' in data) {
    const text = (data as { text?: unknown }).text;
    return typeof text === 'string' ? text : '';
  }
  return '';
}

function pickStreamConversationId(data: unknown): string | undefined {
  if (data && typeof data === 'object' && 'conversationId' in data) {
    const conversationId = (data as { conversationId?: unknown })
      .conversationId;
    return typeof conversationId === 'string' ? conversationId : undefined;
  }
  return undefined;
}

const CONVERSATION_STATUSES: ConversationStatus[] = [
  'active',
  'resolved',
  'escalated',
  'closed',
];

function isConversationStatus(value: unknown): value is ConversationStatus {
  return (
    typeof value === 'string' &&
    (CONVERSATION_STATUSES as string[]).includes(value)
  );
}

/** Đọc `{ status, handoff }` từ data của event SSE 'meta'/'done'; bỏ qua nếu không đúng dạng. */
function pickHandoffState(data: unknown): ConversationHandoffState | undefined {
  if (!data || typeof data !== 'object') return undefined;
  const { status, handoff } = data as { status?: unknown; handoff?: unknown };
  if (!isConversationStatus(status) || typeof handoff !== 'boolean') {
    return undefined;
  }
  return { status, handoff };
}

export const chatService = {
  /** Chatbot thật của từng khách sạn (`POST /conversations/messages`). Cần đăng nhập. */
  async sendHotelMessage(
    payload: SendChatMessageDto
  ): Promise<SendChatMessageResponse> {
    const { data } = await api.post<SendChatMessageResponse>(
      '/conversations/messages',
      payload
    );
    return data;
  },

  /** Chatbot stream (`POST /conversations/messages/stream`). Cần đăng nhập. */
  async sendHotelMessageStream(
    payload: SendChatMessageDto,
    handlers: SendChatMessageStreamHandlers = {}
  ): Promise<SendChatMessageResponse> {
    const token = useAuthStore.getState().accessToken;
    const response = await fetch(
      `${API_BASE_URL}/conversations/messages/stream`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/event-stream',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const message = await response.text();
      throw new Error(message || 'Unable to connect to chatbot stream.');
    }
    if (!response.body) {
      throw new Error('Chatbot stream did not return a readable body.');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let reply = '';
    let conversationId = payload.conversationId;
    // Mặc định khi BE không gửi trạng thái (bản cũ): coi như bot đang trả lời bình thường.
    let handoffState: ConversationHandoffState = {
      status: 'active',
      handoff: false,
    };

    const processFrame = (frame: string) => {
      const parsed = readSseJson(frame);
      if (!parsed) return;

      if (parsed.event === 'meta') {
        const nextConversationId = pickStreamConversationId(parsed.data);
        if (nextConversationId) {
          conversationId = nextConversationId;
          handlers.onConversationId?.(nextConversationId);
        }
      }

      // 'meta' (trước khi LLM chạy) và 'done' (chốt) đều mang trạng thái bàn giao — bot có thể
      // chuyển khách cho lễ tân giữa chừng, nên 'done' mới là giá trị đáng tin.
      if (parsed.event === 'meta' || parsed.event === 'done') {
        const state = pickHandoffState(parsed.data);
        if (state) {
          handoffState = state;
          handlers.onHandoffState?.(state);
        }
        return;
      }

      if (parsed.event === 'chunk') {
        const chunk = pickStreamText(parsed.data);
        if (chunk) {
          reply += chunk;
          handlers.onChunk?.(chunk, reply);
        }
      }
    };

    while (true) {
      const { done, value } = await reader.read();
      buffer += decoder.decode(value, { stream: !done });

      const frames = buffer.split(/\n\n/);
      buffer = frames.pop() ?? '';
      frames.forEach(processFrame);

      if (done) {
        if (buffer.trim()) {
          processFrame(buffer);
        }
        break;
      }
    }

    return { conversationId: conversationId ?? '', reply, ...handoffState };
  },

  /**
   * Các khách sạn khách đã nhắn (`GET /conversations/mine`) — dựng thanh bên kiểu Messenger.
   * Trả mảng rỗng khi khách chưa đăng nhập (BE không định danh được khách vãng lai).
   */
  async listMyConversations(): Promise<MyConversationListItem[]> {
    const { data } = await api.get<MyConversationListItem[]>(
      '/conversations/mine'
    );
    return data;
  },

  /**
   * Hội thoại đang mở của khách ở một KS + lịch sử (`GET /conversations/me?hotelId=`).
   * Không có nó thì khách F5 xong là mất `conversationId` ⇒ không join lại room socket ⇒ không bao
   * giờ nhận được câu trả lời của lễ tân.
   */
  async getMyConversation(hotelId: string): Promise<MyConversationResponse | null> {
    const { data } = await api.get<MyConversationResponse | null>(
      '/conversations/me',
      { params: { hotelId } }
    );
    return data ?? null;
  },

  /**
   * Công tắc AI ⇄ Người thật (`PATCH /conversations/:id/mode`).
   * 'human' đẩy hội thoại vào hàng chờ lễ tân (không phụ thuộc AI có chịu tự bàn giao hay không);
   * 'ai' trả về cho bot. Hội thoại giữ nguyên nên **lịch sử không mất khi gạt qua lại**.
   * Gạt lại đúng chế độ đang dùng là no-op ở BE nên bấm nhiều lần vẫn an toàn.
   */
  async setConversationMode({
    conversationId,
    mode,
    reason,
  }: SetConversationModeDto): Promise<SetConversationModeResponse> {
    const { data } = await api.patch<SetConversationModeResponse>(
      `/conversations/${conversationId}/mode`,
      { mode, reason }
    );
    return data;
  },

  /** Fallback client-side cho các trang chưa có hotelId cụ thể. */
  async reply(text: string): Promise<ChatReply> {
    const lower = text.toLowerCase();

    // 1) Intent: tìm khách sạn theo thành phố → gọi API thật
    const city = detectCity(text);
    if (city) {
      try {
        const res = await hotelService.search({ city, limit: 3 });
        if (res.results.length > 0) {
          return {
            text: `Here are some great stays in ${city}:`,
            recommendations: res.results.map(h => ({
              id: h.id,
              name: h.name,
              city: h.city,
              minPrice: h.minPrice,
              imageUrl: h.images?.[0]?.url,
            })),
            quickReplies: ['See all results', 'Weekend deals'],
          };
        }
        return {
          text: `I couldn't find listed stays in ${city} yet. Try another destination?`,
          quickReplies: DEFAULT_QUICK_REPLIES,
        };
      } catch {
        return {
          text: 'Sorry, I had trouble fetching stays right now. Please try again.',
          quickReplies: DEFAULT_QUICK_REPLIES,
        };
      }
    }

    // 2) Các intent tĩnh
    if (/(deal|khuyến mãi|giá|price|offer)/.test(lower)) {
      return {
        text: 'We have weekend deals running now — check the Deals page for members-only rates.',
        quickReplies: ['Stays in Hoi An', 'Stays in Da Lat'],
      };
    }
    if (/(loyalty|point|điểm|reward|thưởng)/.test(lower)) {
      return {
        text: 'You can view your points and tier on the Loyalty page in your account.',
        quickReplies: ['Stays in Nha Trang', 'Weekend deals'],
      };
    }
    if (/(hello|hi|xin chào|chào|help|giúp)/.test(lower)) {
      return {
        text: "Hello! I'm your AI concierge. Tell me a destination (e.g. Da Nang, Hoi An) and I'll find stays for you.",
        quickReplies: DEFAULT_QUICK_REPLIES,
      };
    }

    // 3) Fallback
    return {
      text: 'I can help you find stays and deals. Which city are you dreaming of?',
      quickReplies: DEFAULT_QUICK_REPLIES,
    };
  },
};
