import type {
  ConversationSocketMessage,
  ConversationStatus,
} from './chat.types';

/** Khách trong hộp thư. `null` khi hội thoại do khách vãng lai (chưa đăng nhập) tạo. */
export interface StaffConversationCustomer {
  id: string;
  fullName: string | null;
  email: string;
  /** Chỉ có ở API chi tiết, danh sách không trả về. */
  phone?: string | null;
}

/** Một dòng trong danh sách hộp thư (`GET /hotels/:hotelId/conversations`). */
export interface StaffConversationListItem {
  id: string;
  status: ConversationStatus;
  subject: string | null;
  channel: string;
  /** Id nhân viên đang cầm hội thoại; `null` = chưa ai nhận. */
  assignedTo: string | null;
  lastMessageAt: string | null;
  /** Nội dung tin cuối để preview; `null` khi hội thoại chưa có tin nào. */
  lastMessage: string | null;
  customer: StaffConversationCustomer | null;
}

export interface StaffConversationsParams {
  status?: ConversationStatus;
  limit?: number;
  page?: number;
}

export interface StaffConversationsResponse {
  results: StaffConversationListItem[];
  page: number;
  limit: number;
  totalPages: number;
  totalResults: number;
}

/**
 * Một tin nhắn trong hội thoại. Cùng là bản ghi bảng `messages` mà socket đẩy về, nên dùng chung
 * một type — khai báo riêng sẽ khiến hai bên trôi lệch khi BE đổi shape.
 */
export type StaffConversationMessage = ConversationSocketMessage;

/** Chi tiết hội thoại + toàn bộ tin nhắn (`GET /hotels/:hotelId/conversations/:conversationId`). */
export interface StaffConversationDetail {
  id: string;
  hotelId: string;
  userId: string | null;
  bookingId: string | null;
  channel: string;
  status: ConversationStatus;
  assignedTo: string | null;
  subject: string | null;
  startedAt: string;
  resolvedAt: string | null;
  lastMessageAt: string | null;
  messages: StaffConversationMessage[];
  customer: StaffConversationCustomer | null;
}

/** Body của `POST /hotels/:hotelId/conversations/:conversationId/reply`. */
export interface ReplyConversationDto {
  conversationId: string;
  message: string;
}

/** Payload của event socket `conversation:escalated` (gửi tới room `hotel:<id>`). */
export interface ConversationEscalatedEvent {
  conversationId: string;
  reason: string;
}
