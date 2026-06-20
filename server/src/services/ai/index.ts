import config from '../../config/config';
import { GeminiProvider } from './gemini.provider';
import type { AiProvider } from './ai.types';

export type { AiProvider, ChatMessage } from './ai.types';

// "Công tắc": ứng với mỗi giá trị AI_PROVIDER là một cách tạo provider.
// Thêm Claude sau = thêm 1 dòng ở đây + 1 file claude.provider.ts, KHÔNG đụng phần còn lại.
const builders: Record<string, () => AiProvider> = {
  gemini: () => new GeminiProvider(),
  // claude: () => new ClaudeProvider(),
};

const build = builders[config.ai.provider];
if (!build) {
  throw new Error(`AI_PROVIDER không hợp lệ: "${config.ai.provider}" (hỗ trợ: ${Object.keys(builders).join(', ')})`);
}

// Cả hệ thống dùng aiProvider này, không cần biết đang là hãng nào.
export const aiProvider: AiProvider = build();
