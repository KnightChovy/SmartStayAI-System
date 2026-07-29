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

/** Một dòng chat hiển thị trên UI (khác `Message` của backend: có thêm trạng thái stream/lỗi). */
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  quickReplies?: string[];
  streaming?: boolean;
  error?: boolean;
}

/** Một đoạn chat lưu dưới máy (kiểu ChatGPT: nhiều đoạn song song, mở lại được).
 *  KHÔNG chứa lời chào: lời chào phụ thuộc ngôn ngữ đang chọn nên phải dựng lại lúc render,
 *  lưu vào đây thì đổi VI⇄EN xong mở lại app sẽ thấy lời chào bằng ngôn ngữ cũ. */
export interface ChatSession {
  id: string;
  /** '' = chưa đặt tên → UI thay bằng nhãn i18n. Cùng lý do với lời chào: không bao giờ
   *  ghi chuỗi i18n xuống storage, nếu không đổi ngôn ngữ xong tên sẽ kẹt ở tiếng cũ. */
  title: string;
  /** true = khách tự đổi tên → thôi tự sinh lại tiêu đề từ tin nhắn đầu. */
  isTitleCustom?: boolean;
  messages: ChatMessage[];
  /** Id hội thoại phía server — giữ theo từng đoạn để mở lại đoạn cũ AI vẫn nhớ ngữ cảnh. */
  conversationId: string;
  createdAt: number;
  updatedAt: number;
}

/** Toàn bộ lịch sử của MỘT tài khoản (hoặc khách vãng lai). */
export interface ChatOwnerState {
  /** Luôn giữ sắp xếp `updatedAt` giảm dần — đoạn mới nhất đứng đầu. */
  sessions: ChatSession[];
  activeSessionId: string | null;
}

/** @deprecated Shape cũ (mỗi tài khoản một hội thoại). Chỉ còn dùng để migrate persist v0 → v2. */
export interface StoredChatThread {
  messages: ChatMessage[];
  conversationId: string;
  updatedAt: number;
}
