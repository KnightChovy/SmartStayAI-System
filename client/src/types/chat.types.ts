/**
 * Type cho chat của khách. Model theo DB `messages`:
 * - senderType: user | ai_bot | staff | system  → ở client gộp 'user' | 'ai' | 'staff'
 * - messageType: text | quick_reply | booking_card | image
 */

/** Ai nói câu này, theo góc nhìn khung chat của khách ('staff' = lễ tân người thật). */
export type ChatSender = 'user' | 'ai' | 'staff';

export interface Message {
  /** Id ổn định để cập nhật đúng bong bóng khi stream (tránh ghi nhầm vào tin của user). */
  id?: string;
  sender: ChatSender;
  text: string;
  time: string;
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

/**
 * Body gửi tới `POST /conversations/messages`.
 * - CÓ `hotelId`  → concierge của MỘT khách sạn (tra/đặt/huỷ phòng, chuyển được cho lễ tân).
 * - KHÔNG `hotelId` → trợ lý TOÀN SÀN: chỉ tư vấn & tìm/gợi ý khách sạn trên sàn.
 */
export interface SendChatMessageDto {
  /** Bỏ trống = chế độ toàn sàn (khung chat nổi). */
  hotelId?: string;
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
 * sau khi F5. `null` khi khách chưa từng chat ở scope này (hoặc chưa đăng nhập).
 * `hotelId` null = hội thoại TOÀN SÀN (gọi endpoint không kèm `hotelId`).
 */
export interface MyConversationResponse extends ConversationHandoffState {
  id: string;
  hotelId: string | null;
  messages: ConversationSocketMessage[];
}

/** Khách sạn của một dòng hội thoại. `null` ở dòng toàn sàn — xem `MyConversationListItem`. */
export interface MyConversationHotel {
  id: string;
  name: string;
  city: string;
  imageUrl: string | null;
}

/**
 * Một dòng trong danh sách hội thoại của khách (`GET /conversations/mine`).
 * `hotelId`/`hotel` là **null** cho hội thoại TOÀN SÀN (khung chat nổi) — BE trả `hotel: null` vì
 * hội thoại đó không gắn khách sạn nào. Trang `/account/messages` chỉ nhắn với lễ tân từng khách
 * sạn nên lọc bỏ dòng này bằng `isHotelConversation`.
 */
export interface MyConversationListItem extends ConversationHandoffState {
  id: string;
  hotelId: string | null;
  lastMessage: string | null;
  lastMessageSender: ChatSenderType | null;
  lastMessageAt: string | null;
  hotel: MyConversationHotel | null;
}

/** Dòng hội thoại CHẮC CHẮN gắn khách sạn — thu hẹp từ `MyConversationListItem`. */
export interface HotelConversationListItem extends MyConversationListItem {
  hotelId: string;
  hotel: MyConversationHotel;
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
  hotelId: string | null;
}

export interface SendChatMessageStreamPayload {
  payload: SendChatMessageDto;
  handlers?: SendChatMessageStreamHandlers;
}
