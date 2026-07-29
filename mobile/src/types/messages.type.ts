/**
 * Type cho luồng nhắn tin guest ↔ nhân viên khách sạn (`/v1/conversations/*`).
 *
 * Backend hợp nhất chat AI và hỗ trợ người thật trong CÙNG một hội thoại: khi guest
 * yêu cầu gặp nhân viên (`mode='human'`) thì hội thoại `escalated`, bot im lặng, tin
 * nhắn đẩy tới nhân viên. Dùng cờ **`handoff`** (BE tính) để biết "đang có người thật
 * xử lý" — KHÔNG dựa vào `status` (sau khi nhân viên trả lời, `status` về `active`
 * nhưng `handoff` vẫn `true`).
 */

/** senderType trong DB. */
export type ChatSenderType = 'user' | 'ai_bot' | 'staff' | 'system';

export type ConversationStatus = 'active' | 'resolved' | 'escalated' | 'closed';

export type ConversationMode = 'ai' | 'human';

export type ConversationMessageType = 'text' | 'image' | 'quick_reply' | 'booking_card';

/** Một tin nhắn (dùng chung cho lịch sử REST). */
export interface ConversationMessage {
  id: string;
  conversationId: string;
  senderType: ChatSenderType;
  senderId: string | null;
  content: string;
  messageType: ConversationMessageType;
  createdAt: string;
}

/** Khách sạn gắn với hội thoại (null = trợ lý toàn nền tảng, không có nhân viên). */
export interface ConversationHotel {
  id: string;
  name: string;
  city: string | null;
  imageUrl: string | null;
}

/** Một dòng ở danh sách hội thoại (`GET /conversations/mine`). */
export interface MyConversationListItem {
  id: string;
  hotelId: string | null;
  status: ConversationStatus;
  handoff: boolean;
  lastMessage: string | null;
  lastMessageSender: ChatSenderType | null;
  lastMessageAt: string | null;
  hotel: ConversationHotel | null;
}

/** Hội thoại đang mở + lịch sử tin (`GET /conversations/me?hotelId=`); null nếu chưa có. */
export interface MyConversationResponse {
  id: string;
  hotelId: string | null;
  status: ConversationStatus;
  handoff: boolean;
  messages: ConversationMessage[];
}

/** Body `POST /conversations/messages` — chỉ gửi field có giá trị (BE chặn chuỗi rỗng). */
export interface SendMessagePayload {
  hotelId?: string;
  conversationId?: string;
  message: string;
}

/** Response gửi tin — kèm `status`/`handoff` để cập nhật trạng thái hội thoại. */
export interface SendMessageResponse {
  conversationId: string;
  reply: string;
  status: ConversationStatus;
  handoff: boolean;
}

/** Body `PATCH /conversations/:id/mode` — guest chuyển AI ⇄ nhân viên. */
export interface SetConversationModePayload {
  mode: ConversationMode;
  reason?: string;
}
