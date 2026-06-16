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

export interface Message {
  sender: 'user' | 'ai';
  text: string;
  time: string;
  /** Gợi ý khách sạn (booking_card) — bấm để mở trang chi tiết. */
  recommendations?: ChatRecommendation[];
  /** Quick reply gợi ý cho người dùng bấm nhanh. */
  quickReplies?: string[];
}

/** Kết quả AI trả về (mock engine). */
export interface ChatReply {
  text: string;
  recommendations?: ChatRecommendation[];
  quickReplies?: string[];
}
