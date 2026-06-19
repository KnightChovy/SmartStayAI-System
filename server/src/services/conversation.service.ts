import httpStatus from 'http-status';
import type { User } from '@prisma/client';
import prisma from '../config/prisma';
import ApiError from '../utils/ApiError';
import logger from '../config/logger';
import { aiProvider, type ChatMessage } from './ai';
import { availabilityService } from './availability.service';
import { AiTool } from './ai/ai.types';

// Độ giống nghĩa giữa 2 vector: ~1 = trùng nghĩa, ~0 = không liên quan (cosine similarity)
const cosine = (a: number[], b: number[]): number => {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) || 1);
};

// #2: chỉ gửi lại N tin gần nhất cho LLM (tránh lịch sử dài vô hạn → tốn token / tràn context)
const MAX_HISTORY = 20;

// #1: cache embedding FAQ theo hotelId — embed 1 lần rồi dùng lại (tránh embed lại 31 câu mỗi tin).
//     Lưu ý: nếu FAQ của KS đổi giữa lúc server đang chạy, cache sẽ cũ tới khi restart.
const faqEmbedCache = new Map<string, { question: string; answer: string; vector: number[] }[]>();

export class ConversationService {
  // (A) Dựng "lời nhắc hệ thống" từ thông tin khách sạn
  private buildSystemPrompt = (
    hotel: {
      name: string;
      city: string;
      description: string | null;
      checkInTime: string | null;
      checkOutTime: string | null;
    },
    faqs: { question: string; answer: string }[]
  ): string => {
    const lines = [
      `Bạn là trợ lý ảo của khách sạn "${hotel.name}" tại ${hotel.city}.`,
      hotel.description ? `Giới thiệu: ${hotel.description}` : '',
      hotel.checkInTime ? `Giờ nhận phòng: ${hotel.checkInTime}.` : '',
      hotel.checkOutTime ? `Giờ trả phòng: ${hotel.checkOutTime}.` : '',
    ];
    // RAG đơn giản: nhét thẳng FAQ của khách sạn vào ngữ cảnh để bot ưu tiên dùng
    if (faqs.length > 0) {
      lines.push('', 'Câu hỏi thường gặp của khách sạn (ưu tiên dùng để trả lời):');
      faqs.forEach((f) => lines.push(`- Hỏi: ${f.question} → Đáp: ${f.answer}`));
    }
    lines.push('', 'Trả lời ngắn gọn, lịch sự, bằng tiếng Việt. Nếu không chắc, hãy mời khách liên hệ lễ tân.');
    return lines.filter(Boolean).join('\n');
  };

  // (A2) RAG bằng vector: chọn topK FAQ GẦN NGHĨA nhất với câu hỏi.
  // #1: vector của FAQ được CACHE theo hotelId (embed 1 lần); mỗi tin chỉ embed thêm CÂU HỎI.
  private retrieveFaqs = async (
    hotelId: string,
    question: string,
    faqs: { question: string; answer: string }[],
    topK = 3
  ): Promise<{ question: string; answer: string }[]> => {
    if (faqs.length <= topK) {
      return faqs; // FAQ ít hơn topK ⇒ khỏi cần chọn lọc, dùng hết
    }
    // Lấy FAQ-kèm-vector từ cache; chưa có thì embed toàn bộ FAQ MỘT LẦN rồi lưu lại
    let indexed = faqEmbedCache.get(hotelId);
    if (!indexed) {
      indexed = await Promise.all(
        faqs.map(async (faq) => ({ ...faq, vector: await aiProvider.embed(faq.question) }))
      );
      faqEmbedCache.set(hotelId, indexed);
    }
    // Mỗi tin chỉ embed CÂU HỎI rồi chấm cosine với vector FAQ đã cache
    const questionVector = await aiProvider.embed(question);
    return indexed
      .map((faq) => ({ faq, score: cosine(questionVector, faq.vector) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      .map((s) => ({ question: s.faq.question, answer: s.faq.answer }));
  };

  // (B) Khai báo các tool chatbot được phép gọi — ĐÓNG KÍN theo hotelId + currentUser (bảo mật)
  private buildTools = (hotelId: string, currentUser: User, conversationId: string): AiTool[] => [
    {
      name: 'search_rooms',
      description:
        'Tra phòng trống và giá của khách sạn theo ngày nhận/trả phòng và số khách. ' +
        'Gọi khi khách hỏi về phòng trống, giá phòng, hoặc muốn đặt phòng.',
      parameters: {
        type: 'object',
        properties: {
          checkInDate: { type: 'string', description: 'Ngày nhận phòng, YYYY-MM-DD' },
          checkOutDate: { type: 'string', description: 'Ngày trả phòng, YYYY-MM-DD' },
          guests: { type: 'number', description: 'Số khách' },
        },
        required: ['checkInDate', 'checkOutDate', 'guests'],
      },
      execute: async (args) => {
        const checkIn = new Date(args.checkInDate as string);
        const checkOut = new Date(args.checkOutDate as string);
        const roomTypes = await prisma.roomType.findMany({
          where: { hotelId, isActive: true, maxOccupancy: { gte: Number(args.guests) } },
          select: { id: true, hotelId: true, name: true, basePrice: true },
        });
        if (roomTypes.length === 0) {
          return 'Không có loại phòng phù hợp với số khách này.';
        }
        const quotes = await availabilityService.getStayQuotes(roomTypes, checkIn, checkOut);
        const lines = roomTypes.map((rt) => {
          const q = quotes.get(rt.id);
          return q && q.availableRooms > 0
            ? `- ${rt.name}: còn ${q.availableRooms} phòng, tổng ${q.totalPrice} VND`
            : `- ${rt.name}: hết phòng`;
        });
        return lines.join('\n');
      },
    },
    {
      name: 'get_booking_status',
      description:
        'Tra trạng thái một booking của khách theo mã booking (bookingCode). ' +
        'Gọi khi khách hỏi về tình trạng đặt phòng / đơn của họ.',
      parameters: {
        type: 'object',
        properties: {
          bookingCode: { type: 'string', description: 'Mã booking, ví dụ BK1A2B3C' },
        },
        required: ['bookingCode'],
      },
      execute: async (args) => {
        // Chỉ tra booking CỦA CHÍNH khách này tại đúng khách sạn này (bảo mật)
        const booking = await prisma.booking.findFirst({
          where: { bookingCode: String(args.bookingCode), hotelId, customerId: currentUser.id },
          include: { roomType: { select: { name: true } } },
        });
        if (!booking) {
          return 'Không tìm thấy booking với mã này (hoặc không thuộc về bạn).';
        }
        const fmt = (d: Date) => d.toISOString().slice(0, 10);
        return [
          `Mã: ${booking.bookingCode}`,
          `Trạng thái: ${booking.status}`,
          `Loại phòng: ${booking.roomType.name}`,
          `Nhận: ${fmt(booking.checkInDate)} → Trả: ${fmt(booking.checkOutDate)}`,
          `Tổng tiền: ${booking.totalAmount} VND`,
        ].join('\n');
      },
    },
    {
      name: 'get_hotel_info',
      description:
        'Lấy thông tin chung của khách sạn: địa chỉ, hạng sao, giờ nhận/trả phòng, danh sách tiện nghi. ' +
        'Gọi khi khách hỏi về tiện nghi, vị trí, hoặc thông tin chung của khách sạn.',
      parameters: {
        type: 'object',
        properties: {},
        required: [],
      },
      execute: async () => {
        const h = await prisma.hotel.findFirst({
          where: { id: hotelId, deletedAt: null },
          include: { amenities: { include: { amenity: true } } },
        });
        if (!h) {
          return 'Không tìm thấy thông tin khách sạn.';
        }
        const amenities = h.amenities.map((a) => a.amenity.name).join(', ') || 'chưa cập nhật';
        return [
          `Tên: ${h.name}`,
          `Địa chỉ: ${h.address}, ${h.city}`,
          h.starRating ? `Hạng: ${h.starRating} sao` : '',
          `Giờ nhận phòng: ${h.checkInTime ?? 'chưa rõ'}, trả phòng: ${h.checkOutTime ?? 'chưa rõ'}`,
          `Tiện nghi: ${amenities}`,
        ]
          .filter(Boolean)
          .join('\n');
      },
    },
    {
      name: 'escalate_to_staff',
      description:
        'Chuyển cuộc trò chuyện cho nhân viên lễ tân xử lý. ' +
        'Gọi khi bạn KHÔNG trả lời được, khách yêu cầu gặp người thật, hoặc khách phàn nàn/khiếu nại.',
      parameters: {
        type: 'object',
        properties: {
          reason: { type: 'string', description: 'Lý do ngắn gọn cần chuyển cho lễ tân' },
        },
        required: ['reason'],
      },
      execute: async (args) => {
        // Khác các tool đọc: tool này GHI — đổi trạng thái hội thoại sang "escalated"
        await prisma.conversation.update({
          where: { id: conversationId },
          data: { status: 'escalated' },
        });
        return `Đã chuyển cuộc trò chuyện cho lễ tân (lý do: ${String(args.reason)}). Nhân viên sẽ liên hệ với bạn sớm.`;
      },
    },
  ];

  sendMessage = async (hotelId: string, conversationId: string | undefined, currentUser: User, text: string) => {
    // (1) Tìm khách sạn
    const hotel = await prisma.hotel.findFirst({
      where: { id: hotelId, deletedAt: null },
      include: { faqKnowledge: { where: { isActive: true }, select: { question: true, answer: true } } },
    });
    if (!hotel) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Không tìm thấy khách sạn');
    }

    // (2) Lấy hội thoại cũ, hoặc tạo mới nếu chưa có
    let conversation = conversationId
      ? await prisma.conversation.findFirst({ where: { id: conversationId, hotelId, userId: currentUser.id } })
      : null;
    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: { hotelId, userId: currentUser.id, channel: 'chatbot', status: 'active' },
      });
    }

    // (3) Lưu tin nhắn của khách
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderType: 'user',
        senderId: currentUser.id,
        content: text,
        messageType: 'text',
      },
    });

    // (4) Đọc N TIN GẦN NHẤT (không lấy toàn bộ — #2) → đổi sang mảng ChatMessage cho LLM
    const recent = await prisma.message.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: 'desc' },
      take: MAX_HISTORY,
    });
    recent.reverse(); // DB trả mới→cũ, đảo lại cũ→mới cho đúng thứ tự hội thoại
    const messages: ChatMessage[] = recent.map((m) => ({
      role: m.senderType === 'user' ? 'user' : 'assistant',
      content: m.content,
    }));

    // (5) Gọi LLM qua "công tắc" — bọc try/catch (#4) để LLM lỗi (429/timeout) không làm sập request
    let reply: string;
    try {
      // RAG: chọn vài FAQ gần nghĩa nhất với câu khách vừa hỏi (thay vì nhét toàn bộ)
      const topFaqs = await this.retrieveFaqs(hotelId, text, hotel.faqKnowledge);
      reply = await aiProvider.chatWithTools(
        this.buildSystemPrompt(hotel, topFaqs),
        messages,
        this.buildTools(hotelId, currentUser, conversation.id)
      );
    } catch (err) {
      logger.error(`[Chatbot] LLM lỗi: ${(err as Error).message}`);
      reply = 'Xin lỗi, trợ lý đang bận. Bạn vui lòng thử lại sau ít phút, hoặc liên hệ lễ tân giúp em nhé.';
    }

    // (6) Lưu câu trả lời của bot
    await prisma.message.create({
      data: { conversationId: conversation.id, senderType: 'ai_bot', content: reply, messageType: 'text' },
    });
    await prisma.conversation.update({ where: { id: conversation.id }, data: { lastMessageAt: new Date() } });

    // (7) Trả về cho lớp trên
    return { conversationId: conversation.id, reply };
  };

  // Bản STREAM: chuẩn bị (await) xong, trả về conversationId NGAY + một generator đẩy chữ dần.
  // Controller gửi conversationId trước, rồi for-await generator để bơm từng mẩu ra client (SSE).
  streamMessage = async (
    hotelId: string,
    conversationId: string | undefined,
    currentUser: User,
    text: string
  ): Promise<{ conversationId: string; stream: AsyncGenerator<string> }> => {
    // (1)-(4): y hệt sendMessage — tìm KS+FAQ, lấy/tạo hội thoại, lưu tin khách, đọc lịch sử
    const hotel = await prisma.hotel.findFirst({
      where: { id: hotelId, deletedAt: null },
      include: { faqKnowledge: { where: { isActive: true }, select: { question: true, answer: true } } },
    });
    if (!hotel) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Không tìm thấy khách sạn');
    }

    let conversation = conversationId
      ? await prisma.conversation.findFirst({ where: { id: conversationId, hotelId, userId: currentUser.id } })
      : null;
    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: { hotelId, userId: currentUser.id, channel: 'chatbot', status: 'active' },
      });
    }

    await prisma.message.create({
      data: { conversationId: conversation.id, senderType: 'user', senderId: currentUser.id, content: text, messageType: 'text' },
    });

    const recent = await prisma.message.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: 'desc' },
      take: MAX_HISTORY,
    });
    recent.reverse();
    const messages: ChatMessage[] = recent.map((m) => ({
      role: m.senderType === 'user' ? 'user' : 'assistant',
      content: m.content,
    }));

    // (5) chuẩn bị sẵn prompt + tools để generator dùng
    const topFaqs = await this.retrieveFaqs(hotelId, text, hotel.faqKnowledge);
    const systemPrompt = this.buildSystemPrompt(hotel, topFaqs);
    const tools = this.buildTools(hotelId, currentUser, conversation.id);
    const convId = conversation.id;

    // (6) generator: đẩy từng mẩu ra, GOM lại thành câu đầy đủ, lưu DB SAU KHI stream xong
    async function* generate(): AsyncGenerator<string> {
      let full = '';
      try {
        for await (const chunk of aiProvider.chatWithToolsStream(systemPrompt, messages, tools)) {
          full += chunk;
          yield chunk;
        }
      } catch (err) {
        logger.error(`[Chatbot] stream lỗi: ${(err as Error).message}`);
        full = 'Xin lỗi, trợ lý đang bận. Bạn thử lại sau ít phút giúp em nhé.';
        yield full;
      }
      // lưu câu trả lời đầy đủ + cập nhật thời điểm
      await prisma.message.create({
        data: { conversationId: convId, senderType: 'ai_bot', content: full, messageType: 'text' },
      });
      await prisma.conversation.update({ where: { id: convId }, data: { lastMessageAt: new Date() } });
    }

    return { conversationId: convId, stream: generate() };
  };
}

export const conversationService = new ConversationService();
