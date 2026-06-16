import { hotelService } from './hotel.service';
import type { ChatReply } from '@/types/chat.types';

/**
 * [MOCK engine] Digital Concierge. Backend chưa có endpoint chatbot
 * (DB có `conversations`/`messages`), nên xử lý intent đơn giản ở client.
 * Điểm GROUNDED: khi nhận diện thành phố, gọi API THẬT `/hotels` để gợi ý
 * khách sạn có thật → bấm vào mở trang chi tiết.
 */

// Một số thành phố để dò trong câu hỏi của người dùng
const KNOWN_CITIES = [
  'Da Nang', 'Đà Nẵng', 'Ha Noi', 'Hà Nội', 'Hanoi', 'Ho Chi Minh', 'Hồ Chí Minh', 'Saigon',
  'Hoi An', 'Hội An', 'Da Lat', 'Đà Lạt', 'Dalat', 'Nha Trang', 'Phu Quoc', 'Phú Quốc',
  'Ha Long', 'Hạ Long', 'Hue', 'Huế', 'Vung Tau', 'Vũng Tàu', 'Sapa', 'Sa Pa',
];

const DEFAULT_QUICK_REPLIES = ['Stays in Da Nang', 'Weekend deals', 'My loyalty points'];

function detectCity(text: string): string | null {
  const lower = text.toLowerCase();
  const match = KNOWN_CITIES.find(c => lower.includes(c.toLowerCase()));
  return match ?? null;
}

export const chatService = {
  async reply(text: string): Promise<ChatReply> {
    const lower = text.toLowerCase();

    // 1) Intent: tìm khách sạn theo thành phố → gọi API thật
    const city = detectCity(text);
    if (city) {
      try {
        const res = await hotelService.search({ city, limit: 3 });
        if (res.results.length > 0) {
          return {
            text: `Here are some great stays in ${city}:`,
            recommendations: res.results.map(h => ({
              id: h.id,
              name: h.name,
              city: h.city,
              minPrice: h.minPrice,
              imageUrl: h.images?.[0]?.url,
            })),
            quickReplies: ['See all results', 'Weekend deals'],
          };
        }
        return {
          text: `I couldn't find listed stays in ${city} yet. Try another destination?`,
          quickReplies: DEFAULT_QUICK_REPLIES,
        };
      } catch {
        return {
          text: 'Sorry, I had trouble fetching stays right now. Please try again.',
          quickReplies: DEFAULT_QUICK_REPLIES,
        };
      }
    }

    // 2) Các intent tĩnh
    if (/(deal|khuyến mãi|giá|price|offer)/.test(lower)) {
      return {
        text: "We have weekend deals running now — check the Deals page for members-only rates.",
        quickReplies: ['Stays in Hoi An', 'Stays in Da Lat'],
      };
    }
    if (/(loyalty|point|điểm|reward|thưởng)/.test(lower)) {
      return {
        text: 'You can view your points and tier on the Loyalty page in your account.',
        quickReplies: ['Stays in Nha Trang', 'Weekend deals'],
      };
    }
    if (/(hello|hi|xin chào|chào|help|giúp)/.test(lower)) {
      return {
        text: "Hello! I'm your AI concierge. Tell me a destination (e.g. Da Nang, Hoi An) and I'll find stays for you.",
        quickReplies: DEFAULT_QUICK_REPLIES,
      };
    }

    // 3) Fallback
    return {
      text: 'I can help you find stays and deals. Which city are you dreaming of?',
      quickReplies: DEFAULT_QUICK_REPLIES,
    };
  },
};
