/** Type cho AI Booking Chatbot — model theo backend (`/v1/conversations/*`). */

/** Body gửi tới `POST /conversations/messages` và `.../messages/stream`.
 *  `hotelId`/`conversationId` chỉ gửi khi có giá trị — backend không cho phép chuỗi rỗng. */
export interface SendChatMessageDto {
  hotelId?: string;
  conversationId?: string;
  message: string;
}

/** Response của `POST /conversations/messages` (bản non-stream). */
export interface SendChatMessageResponse {
  conversationId: string;
  reply: string;
}

/** Callback cho bản stream (SSE) — nhận id hội thoại + từng mẩu chữ. */
export interface SendChatMessageStreamHandlers {
  onConversationId?: (conversationId: string) => void;
  onChunk?: (chunk: string, fullText: string) => void;
}
