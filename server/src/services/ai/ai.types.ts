/**
 * "Ổ chuẩn" của lớp AI — mọi nhà cung cấp LLM (Gemini, Claude, ...) đều phải làm đúng việc này.
 * Phần còn lại của hệ thống chỉ nói chuyện qua đây, KHÔNG dính cứng vào hãng nào.
 */

/** Một dòng trong cuộc hội thoại. Dùng chung cho mọi hãng (mỗi provider tự dịch sang định dạng riêng). */
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

/** Một "tool" chatbot có thể gọi. */
export interface AiTool {
  name: string;
  description: string;
  // Mô tả các tham số model phải truyền (kiểu JSON Schema rút gọn)
  parameters: {
    type: 'object';
    properties: Record<string, { type: string; description?: string }>;
    required?: string[];
  };
  // Code THẬT chạy khi model gọi tool này; trả về chuỗi kết quả để đưa lại cho model
  execute: (args: Record<string, unknown>) => Promise<string>;
}

/** Hợp đồng mà mọi provider phải tuân theo. */
export interface AiProvider {
  /**
   * Gửi (lời nhắc hệ thống + lịch sử hội thoại) cho LLM, nhận lại câu trả lời dạng chữ.
   * @param systemPrompt ngữ cảnh nền (vd: "Bạn là trợ lý của Khách sạn X...")
   * @param messages toàn bộ lịch sử hội thoại tới lúc này
   */
  chat(systemPrompt: string, messages: ChatMessage[]): Promise<string>;
  chatWithTools(systemPrompt: string, messages: ChatMessage[], tools: AiTool[]): Promise<string>;
  // Đổi một đoạn chữ → "dấu vân tay ý nghĩa" (vector số). Dùng cho RAG/tìm câu gần nghĩa.
  embed(text: string): Promise<number[]>;
  // Giống chatWithTools nhưng TRẢ DẦN từng mẩu chữ (cho UX gõ chữ chạy). Dùng async generator.
  chatWithToolsStream(systemPrompt: string, messages: ChatMessage[], tools: AiTool[]): AsyncGenerator<string>;
}
