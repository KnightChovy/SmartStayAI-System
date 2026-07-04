import { GoogleGenAI, Type } from '@google/genai';
import type { Content, FunctionDeclaration, Part, FunctionCall } from '@google/genai';
import config from '../../config/config';
import type { AiProvider, AiTool, ChatMessage } from './ai.types';

// Model free, nhanh. flash-lite có quota free/ngày RỘNG hơn gemini-2.5-flash (chỉ ~20 req/ngày).
// Nếu báo 429 "limit: 0", model đó không free trên key của bạn — đổi tên khác.
const GEMINI_MODEL = 'gemini-2.5-flash-lite';
// Model đổi chữ → vector (free). Nếu lỗi 404, đổi tên theo docs Gemini hiện hành.
const EMBED_MODEL = 'gemini-embedding-001';
const MAX_TOOL_ROUNDS = 5;
// Trần token đầu ra mỗi lần gọi — chặn chi phí/lạm dụng: câu trả lời concierge không cần dài hơn.
const MAX_OUTPUT_TOKENS = 800;
const TYPE_MAP: Record<string, Type> = {
  string: Type.STRING,
  number: Type.NUMBER,
  integer: Type.INTEGER,
  boolean: Type.BOOLEAN,
};

// Lỗi TẠM THỜI (Gemini quá tải) → nên thử lại. CHỈ 503/500: server bận chốc lát.
// CỐ Ý không tính 429 (RESOURCE_EXHAUSTED): đó là hết quota NGÀY — retry vô ích mà còn đốt thêm lượt.
const isTransient = (err: unknown): boolean => {
  const status = (err as { status?: number }).status;
  const message = err instanceof Error ? err.message : '';
  return status === 503 || status === 500 || /50[03]|UNAVAILABLE|high demand|overload/i.test(message);
};

// Gọi 1 hàm async; nếu lỗi tạm thời thì chờ rồi thử lại (tối đa `retries` lần, chờ tăng dần)
const withRetry = async <T>(fn: () => Promise<T>, retries = 2): Promise<T> => {
  for (let attempt = 0; ; attempt += 1) {
    try {
      // eslint-disable-next-line no-await-in-loop
      return await fn();
    } catch (err) {
      if (attempt >= retries || !isTransient(err)) {
        throw err;
      }
      // eslint-disable-next-line no-await-in-loop
      await new Promise((resolve) => {
        setTimeout(resolve, 700 * (attempt + 1)); // 0.7s rồi 1.4s
      });
    }
  }
};
/**
 * Bản cài Gemini của "ổ chuẩn" AiProvider.
 * Khác biệt với ổ chuẩn (do Gemini quy định): vai trò bot là 'model' (không phải 'assistant'),
 * nội dung gói trong { parts: [{ text }] }, và lời nhắc hệ thống đi ở config.systemInstruction.
 */

export class GeminiProvider implements AiProvider {
  private client = new GoogleGenAI({ apiKey: config.ai.geminiApiKey });

  // Đổi một đoạn chữ → vector số (dấu vân tay ý nghĩa)
  embed = async (text: string): Promise<number[]> => {
    const res = await withRetry(() => this.client.models.embedContent({ model: EMBED_MODEL, contents: text }));
    return res.embeddings?.[0]?.values ?? [];
  };

  chat = async (systemPrompt: string, messages: ChatMessage[]): Promise<string> => {
    // Dịch lịch sử chung → định dạng Gemini
    const contents = messages.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const response = await withRetry(() =>
      this.client.models.generateContent({
        model: GEMINI_MODEL,
        contents,
        config: { systemInstruction: systemPrompt, maxOutputTokens: MAX_OUTPUT_TOKENS, temperature: 0.3 },
      })
    );

    return response.text ?? '';
  };
  // thêm 2 hàm "dịch" + hàm chatWithTools vào trong class (giữ nguyên chat cũ):

  // ChatMessage chung → contents kiểu Gemini
  private toContents = (messages: ChatMessage[]): Content[] =>
    messages.map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }));

  // AiTool[] của ta → "tờ khai hàm" kiểu Gemini
  private toDeclarations = (tools: AiTool[]): FunctionDeclaration[] =>
    tools.map((t) => {
      const properties: Record<string, { type: Type; description?: string }> = {};
      for (const [key, p] of Object.entries(t.parameters.properties)) {
        properties[key] = { type: TYPE_MAP[p.type] ?? Type.STRING, description: p.description };
      }
      return {
        name: t.name,
        description: t.description,
        parameters: { type: Type.OBJECT, properties, required: t.parameters.required ?? [] },
      };
    });
  chatWithTools = async (systemPrompt: string, messages: ChatMessage[], tools: AiTool[]): Promise<string> => {
    const contents = this.toContents(messages);
    const functionDeclarations = this.toDeclarations(tools);

    for (let round = 0; round < MAX_TOOL_ROUNDS; round += 1) {
      // ① gửi
      // eslint-disable-next-line no-await-in-loop
      const response = await withRetry(() =>
        this.client.models.generateContent({
          model: GEMINI_MODEL,
          contents,
          config: {
            systemInstruction: systemPrompt,
            tools: [{ functionDeclarations }],
            maxOutputTokens: MAX_OUTPUT_TOKENS,
            temperature: 0.3,
          },
        })
      );

      // ② có xin gọi hàm không?
      const calls = response.functionCalls;
      if (!calls || calls.length === 0) {
        return response.text ?? ''; // không → đây là câu trả lời cuối
      }

      // ③ lưu lượt "Gemini xin gọi hàm"
      contents.push({ role: 'model', parts: calls.map((c) => ({ functionCall: c })) });

      // ④ chạy execute từng tool
      const resultParts: Part[] = [];
      for (const call of calls) {
        const tool = tools.find((t) => t.name === call.name);
        // eslint-disable-next-line no-await-in-loop
        const result = tool ? await tool.execute(call.args ?? {}) : `Không có tool "${call.name}".`;
        resultParts.push({ functionResponse: { name: call.name ?? '', response: { result } } });
      }

      // ⑤ nhét kết quả lại → vòng lặp gọi lại Gemini
      contents.push({ role: 'user', parts: resultParts });
    }

    return 'Xin lỗi, tôi chưa hoàn tất được yêu cầu. Bạn liên hệ lễ tân giúp nhé.';
  };

  // Bản STREAM của chatWithTools: vòng lặp y hệt, nhưng dùng generateContentStream và `yield`
  // từng mẩu text ra ngay khi nhận được (thay vì đợi đủ rồi return một cục).
  // Là async generator (async *...) nên không viết được dạng arrow field.
  async *chatWithToolsStream(
    systemPrompt: string,
    messages: ChatMessage[],
    tools: AiTool[]
  ): AsyncGenerator<string> {
    const contents = this.toContents(messages);
    const functionDeclarations = this.toDeclarations(tools);

    for (let round = 0; round < MAX_TOOL_ROUNDS; round += 1) {
      // generateContentStream: trả về luồng các mẩu (chunk) thay vì 1 response
      // eslint-disable-next-line no-await-in-loop
      // eslint-disable-next-line no-await-in-loop
      const stream = await withRetry(() =>
        this.client.models.generateContentStream({
          model: GEMINI_MODEL,
          contents,
          config: {
            systemInstruction: systemPrompt,
            tools: [{ functionDeclarations }],
            maxOutputTokens: MAX_OUTPUT_TOKENS,
            temperature: 0.3,
          },
        })
      );

      const calls: FunctionCall[] = [];
      // eslint-disable-next-line no-restricted-syntax
      for await (const chunk of stream) {
        if (chunk.text) {
          yield chunk.text; // đẩy ngay mẩu chữ ra ngoài
        }
        if (chunk.functionCalls) {
          calls.push(...chunk.functionCalls); // gom các lần xin gọi hàm
        }
      }

      if (calls.length === 0) {
        return; // không xin gọi hàm nữa → đã stream xong câu trả lời cuối
      }

      // Có gọi tool → xử lý y như bản không stream rồi lặp lại
      contents.push({ role: 'model', parts: calls.map((c) => ({ functionCall: c })) });
      const resultParts: Part[] = [];
      for (const call of calls) {
        const tool = tools.find((t) => t.name === call.name);
        // eslint-disable-next-line no-await-in-loop
        const result = tool ? await tool.execute(call.args ?? {}) : `Không có tool "${call.name}".`;
        resultParts.push({ functionResponse: { name: call.name ?? '', response: { result } } });
      }
      contents.push({ role: 'user', parts: resultParts });
    }
  }
}
