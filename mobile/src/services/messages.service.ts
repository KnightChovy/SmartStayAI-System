import { api } from '@/lib/api';
import type {
  MyConversationListItem,
  MyConversationResponse,
  SendMessagePayload,
  SendMessageResponse,
  SetConversationModePayload,
} from '@/types/messages.type';

/**
 * Tầng gọi API nhắn tin guest ↔ nhân viên khách sạn (`/v1/conversations`).
 * Cùng bộ endpoint với chatbot AI; phân biệt người thật/bot qua cờ `handoff`.
 */
export const messagesService = {
  /** `GET /conversations/mine` — danh sách hội thoại của tôi (kiểu Messenger). */
  async listMine(): Promise<MyConversationListItem[]> {
    const { data } = await api.get<MyConversationListItem[]>('/conversations/mine');
    return data;
  },

  /**
   * `GET /conversations/me?hotelId=` — khôi phục hội thoại đang mở + lịch sử tin.
   * Trả `null` nếu chưa từng nhắn với khách sạn này.
   */
  async getMine(hotelId?: string): Promise<MyConversationResponse | null> {
    const { data } = await api.get<MyConversationResponse | null>('/conversations/me', {
      params: hotelId ? { hotelId } : undefined,
    });
    return data;
  },

  /** `POST /conversations/messages` — gửi tin (bot trả lời, hoặc ghi cho nhân viên). */
  async sendMessage(payload: SendMessagePayload): Promise<SendMessageResponse> {
    const { data } = await api.post<SendMessageResponse>('/conversations/messages', payload);
    return data;
  },

  /** `PATCH /conversations/:id/mode` — chuyển sang nhân viên (`human`) hoặc lại AI (`ai`). */
  async setMode(
    conversationId: string,
    payload: SetConversationModePayload,
  ): Promise<MyConversationResponse> {
    const { data } = await api.patch<MyConversationResponse>(
      `/conversations/${conversationId}/mode`,
      payload,
    );
    return data;
  },
};
