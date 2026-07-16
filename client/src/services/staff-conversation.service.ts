import { api } from '@/lib/api';
import type {
  ReplyConversationDto,
  StaffConversationDetail,
  StaffConversationMessage,
  StaffConversationsParams,
  StaffConversationsResponse,
} from '@/types/staff-conversation.types';

/** Bỏ field rỗng khỏi query string. */
function cleanParams<T extends object>(params: T): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(params).filter(
      ([, v]) => v !== undefined && v !== null && v !== ''
    )
  );
}

/**
 * Hộp thư hội thoại của một khách sạn (S04) — nhân viên xem & trả lời khách.
 *
 * Mọi endpoint nằm dưới `/hotels/:hotelId/...`; BE tự kiểm quyền qua `getOperableHotel`
 * (chủ KS / manager / staff được phân công), nên FE chỉ cần truyền đúng hotelId đang trực.
 */
export const staffConversationService = {
  /** `GET /hotels/:hotelId/conversations` — danh sách hội thoại, lọc theo trạng thái. */
  async list(
    hotelId: string,
    params: StaffConversationsParams = {}
  ): Promise<StaffConversationsResponse> {
    const { data } = await api.get<StaffConversationsResponse>(
      `/hotels/${hotelId}/conversations`,
      { params: cleanParams(params) }
    );
    return data;
  },

  /** `GET /hotels/:hotelId/conversations/:conversationId` — chi tiết + toàn bộ tin nhắn. */
  async get(
    hotelId: string,
    conversationId: string
  ): Promise<StaffConversationDetail> {
    const { data } = await api.get<StaffConversationDetail>(
      `/hotels/${hotelId}/conversations/${conversationId}`
    );
    return data;
  },

  /**
   * `POST /hotels/:hotelId/conversations/:conversationId/reply` — nhân viên trả lời khách.
   * BE đồng thời NHẬN hội thoại về mình (`assignedTo`) và đưa status về 'active' để rời hàng chờ.
   */
  async reply(
    hotelId: string,
    { conversationId, message }: ReplyConversationDto
  ): Promise<StaffConversationMessage> {
    const { data } = await api.post<StaffConversationMessage>(
      `/hotels/${hotelId}/conversations/${conversationId}/reply`,
      { message }
    );
    return data;
  },

  /**
   * `POST /hotels/:hotelId/conversations/:conversationId/resolve` — đánh dấu xử lý xong.
   * Đây là điểm DUY NHẤT trả khách về cho bot: BE xoá `assignedTo` nên bot mới được trả lời lại.
   */
  async resolve(
    hotelId: string,
    conversationId: string
  ): Promise<StaffConversationDetail> {
    const { data } = await api.post<StaffConversationDetail>(
      `/hotels/${hotelId}/conversations/${conversationId}/resolve`
    );
    return data;
  },
};
