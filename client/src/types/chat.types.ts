/**
 * Type cho chat Digital Concierge. Model theo DB `messages`:
 * - senderType: user | ai_bot | staff | system  → ở client gộp 'user' | 'ai'
 * - messageType: text | quick_reply | booking_card | image
 * `recommendations` ứng với booking_card (gợi ý phòng/khách sạn).
 */
export interface ChatRecommendation {
  id: string;
  name: string;
  city: string;
  minPrice: string | null;
  imageUrl?: string;
}

/** Ai nói câu này, theo góc nhìn khung chat của khách ('staff' = lễ tân người thật). */
export type ChatSender = 'user' | 'ai' | 'staff';

export interface Message {
  /** Id ổn định để cập nhật đúng bong bóng khi stream (tránh ghi nhầm vào tin của user). */
  id?: string;
  sender: ChatSender;
  text: string;
  time: string;
  /** Gợi ý khách sạn (booking_card) — bấm để mở trang chi tiết. */
  recommendations?: ChatRecommendation[];
  /** Quick reply gợi ý cho người dùng bấm nhanh. */
  quickReplies?: string[];
}

/** Trạng thái hội thoại ở BE (`ConversationStatus` trong prisma schema). */
export type ConversationStatus = 'active' | 'resolved' | 'escalated' | 'closed';

/**
 * Trạng thái bàn giao mà mọi endpoint chat trả về.
 * `handoff` = BE đã tự tính "người thật đang cầm hội thoại" (đang chờ lễ tân HOẶC đã có nhân viên
 * nhận xử lý). PHẢI dùng cờ này thay vì tự suy từ `status`: sau khi nhân viên trả lời, status quay
 * về 'active' nhưng bot vẫn im — nhìn mỗi status sẽ tưởng nhầm là đã về chế độ bot.
 */
export interface ConversationHandoffState {
  status: ConversationStatus;
  handoff: boolean;
}

/** `SenderType` của bảng `messages` ở BE. */
export type ChatSenderType = 'user' | 'ai_bot' | 'staff' | 'system';

/** Payload của event socket `message:new` — bản ghi `Message` thô từ Prisma. */
export interface ConversationSocketMessage {
  id: string;
  conversationId: string;
  senderType: ChatSenderType;
  senderId: string | null;
  content: string;
  messageType: 'text' | 'image' | 'quick_reply' | 'booking_card';
  createdAt: string;
}

/** Kết quả AI trả về (mock engine). */
export interface ChatReply {
  text: string;
  recommendations?: ChatRecommendation[];
  quickReplies?: string[];
}

/** Body gửi tới `POST /conversations/messages`. */
export interface SendChatMessageDto {
  hotelId: string;
  conversationId?: string;
  message: string;
}

/** Response backend chatbot trả về. */
export interface SendChatMessageResponse extends ConversationHandoffState {
  conversationId: string;
  reply: string;
}

export interface SendChatMessageStreamHandlers {
  onConversationId?: (conversationId: string) => void;
  onChunk?: (chunk: string, fullText: string) => void;
  /**
   * Trạng thái bàn giao. Gọi 2 lần: ở event 'meta' (trước khi LLM chạy) và 'done' (chốt) — bot có thể
   * tự chuyển khách cho lễ tân GIỮA CHỪNG lượt này, nên chỉ giá trị ở 'done' mới đáng tin.
   */
  onHandoffState?: (state: ConversationHandoffState) => void;
}

/**
 * `GET /conversations/me?hotelId=` — hội thoại đang mở của khách + lịch sử, để khung chat khôi phục
 * sau khi F5. `null` khi khách chưa từng chat với KS này (hoặc chưa đăng nhập).
 */
export interface MyConversationResponse extends ConversationHandoffState {
  id: string;
  hotelId: string;
  messages: ConversationSocketMessage[];
}

/**
 * Một dòng trong thanh bên "đã nhắn với khách sạn nào" của khách (`GET /conversations/mine`).
 */
export interface MyConversationListItem extends ConversationHandoffState {
  id: string;
  hotelId: string;
  lastMessage: string | null;
  lastMessageSender: ChatSenderType | null;
  lastMessageAt: string | null;
  hotel: {
    id: string;
    name: string;
    city: string;
    imageUrl: string | null;
  };
}

/** Khách muốn ai trả lời mình: trợ lý AI hay lễ tân người thật. */
export type ConversationMode = 'ai' | 'human';

/**
 * Body gửi tới `PATCH /conversations/:conversationId/mode` — công tắc AI ⇄ Người thật.
 * Hội thoại KHÔNG đổi, chỉ đổi người trả lời, nên lịch sử được giữ khi gạt qua lại.
 */
export interface SetConversationModeDto {
  conversationId: string;
  mode: ConversationMode;
  /** Chỉ dùng khi mode = 'human'; để trống thì BE lấy lý do mặc định. */
  reason?: string;
}

/** Response của endpoint mode: bản ghi hội thoại + cờ handoff. */
export interface SetConversationModeResponse extends ConversationHandoffState {
  id: string;
  hotelId: string;
}

export interface SendChatMessageStreamPayload {
  payload: SendChatMessageDto;
  handlers?: SendChatMessageStreamHandlers;
}
