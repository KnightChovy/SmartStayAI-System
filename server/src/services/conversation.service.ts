import httpStatus from 'http-status';
import type { User } from '@prisma/client';
import prisma from '../config/prisma';
import ApiError from '../utils/ApiError';
import logger from '../config/logger';
import { aiProvider, type ChatMessage } from './ai';
import { availabilityService } from './availability.service';
import { bookingService } from './booking.service';
import { AiTool } from './ai/ai.types';
import { setPendingAction, consumePendingAction } from './ai/pending-action.store';

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
    // Luật cho HÀNH ĐỘNG GHI (đặt/huỷ): bắt buộc 2 bước có CỔNG XÁC NHẬN để không đặt/huỷ nhầm cho khách
    lines.push(
      '',
      'Bạn CÓ THỂ giúp khách ĐẶT PHÒNG và HUỶ PHÒNG (không chỉ tư vấn). Quy trình BẮT BUỘC:',
      '1) Gọi prepare_booking (đặt) hoặc prepare_cancellation (huỷ) để lấy TÓM TẮT — bước này CHƯA thay đổi gì thật.',
      '2) Đọc tóm tắt cho khách và HỎI khách có đồng ý không.',
      '3) CHỈ khi khách đồng ý rõ ràng ở lượt sau (vâng/ok/đặt đi/huỷ đi...) mới gọi confirm_action (không cần tham số) để thực hiện.',
      'TUYỆT ĐỐI không gọi confirm_action khi khách chưa đồng ý. Mỗi lần đặt/huỷ phải prepare lại trước.'
    );
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
    {
      name: 'prepare_booking',
      description:
        'BƯỚC 1 để ĐẶT PHÒNG: kiểm tra phòng trống + tính giá rồi tạo "phiếu chờ xác nhận". ' +
        'KHÔNG đặt phòng thật ở bước này. Trả về tóm tắt + mã xác nhận để bạn đọc cho khách và hỏi đồng ý.',
      parameters: {
        type: 'object',
        properties: {
          roomTypeName: { type: 'string', description: 'Tên loại phòng, ví dụ "Phòng Cổ Điển"' },
          checkInDate: { type: 'string', description: 'Ngày nhận phòng, YYYY-MM-DD' },
          checkOutDate: { type: 'string', description: 'Ngày trả phòng, YYYY-MM-DD' },
          guests: { type: 'number', description: 'Số khách' },
          paymentMethod: {
            type: 'string',
            description: "Hình thức trả: 'cash' = trả tiền mặt tại khách sạn (mặc định), 'vnpay' = trả online",
          },
        },
        required: ['roomTypeName', 'checkInDate', 'checkOutDate', 'guests'],
      },
      execute: async (args) => {
        // Khách gọi phòng theo TÊN; tra ra id thật trong đúng khách sạn này
        const roomType = await prisma.roomType.findFirst({
          where: { hotelId, isActive: true, name: { equals: String(args.roomTypeName), mode: 'insensitive' } },
          select: { id: true, hotelId: true, name: true, basePrice: true, maxOccupancy: true },
        });
        if (!roomType) {
          return `Không tìm thấy loại phòng tên "${String(args.roomTypeName)}". Hãy dùng search_rooms để xem các loại phòng có thật.`;
        }
        const guests = Number(args.guests);
        if (guests > roomType.maxOccupancy) {
          return `Loại phòng "${roomType.name}" chỉ chứa tối đa ${roomType.maxOccupancy} khách.`;
        }
        // Báo giá + tồn kho dùng ĐÚNG hàm như search (giá server tự tính, không tin client)
        const checkIn = new Date(String(args.checkInDate));
        const checkOut = new Date(String(args.checkOutDate));
        const quote = (await availabilityService.getStayQuotes([roomType], checkIn, checkOut)).get(roomType.id);
        if (!quote || quote.availableRooms < 1) {
          return `Tiếc quá, "${roomType.name}" đã hết phòng cho khoảng ngày này.`;
        }
        const method = args.paymentMethod === 'vnpay' ? 'vnpay' : 'cash';
        const methodText = method === 'cash' ? 'trả tiền mặt tại khách sạn' : 'thanh toán online (VNPay)';
        const summary =
          `Đặt ${roomType.name} | ${String(args.checkInDate)} → ${String(args.checkOutDate)} | ` +
          `${guests} khách | ${methodText} | tổng ${quote.totalPrice} VND`;
        setPendingAction(conversationId, {
          type: 'create_booking',
          customerId: currentUser.id,
          payload: {
            hotelId,
            roomTypeId: roomType.id,
            checkInDate: String(args.checkInDate),
            checkOutDate: String(args.checkOutDate),
            numGuests: guests,
            paymentMethod: method,
          },
          summary,
        });
        return (
          `Đã tạo phiếu chờ xác nhận:\n${summary}\n` +
          `Hãy đọc tóm tắt cho khách và HỎI khách đồng ý đặt không. ` +
          `CHỈ khi khách đồng ý mới gọi confirm_action (không cần tham số).`
        );
      },
    },
    {
      name: 'prepare_cancellation',
      description:
        'BƯỚC 1 để HUỶ PHÒNG: kiểm tra booking có huỷ được không rồi tạo "phiếu chờ xác nhận". ' +
        'KHÔNG huỷ thật ở bước này. Trả về tóm tắt + mã xác nhận để hỏi khách.',
      parameters: {
        type: 'object',
        properties: {
          bookingCode: { type: 'string', description: 'Mã booking cần huỷ, ví dụ BK1A2B3C' },
        },
        required: ['bookingCode'],
      },
      execute: async (args) => {
        // Chỉ huỷ được booking CỦA CHÍNH khách này tại đúng khách sạn này (bảo mật)
        const booking = await prisma.booking.findFirst({
          where: { bookingCode: String(args.bookingCode), hotelId, customerId: currentUser.id },
          include: { roomType: { select: { name: true } } },
        });
        if (!booking) {
          return 'Không tìm thấy booking với mã này (hoặc không thuộc về bạn).';
        }
        if (booking.status !== 'pending' && booking.status !== 'confirmed') {
          return `Booking đang ở trạng thái "${booking.status}", không thể huỷ.`;
        }
        const fmt = (d: Date) => d.toISOString().slice(0, 10);
        const summary =
          `Huỷ booking ${booking.bookingCode} | ${booking.roomType.name} | ` +
          `${fmt(booking.checkInDate)} → ${fmt(booking.checkOutDate)} | tổng ${booking.totalAmount} VND. ` +
          `Tiền hoàn (nếu đã thanh toán) tính theo chính sách huỷ của khách sạn.`;
        setPendingAction(conversationId, {
          type: 'cancel_booking',
          customerId: currentUser.id,
          payload: { bookingId: booking.id },
          summary,
        });
        return (
          `Đã tạo phiếu chờ xác nhận:\n${summary}\n` +
          `Hãy hỏi khách có chắc chắn huỷ không. CHỈ khi khách đồng ý mới gọi confirm_action (không cần tham số).`
        );
      },
    },
    {
      name: 'confirm_action',
      description:
        'BƯỚC 2: thực thi THẬT hành động đã chuẩn bị (đặt/huỷ phòng) cho hội thoại này. ' +
        'CHỈ gọi khi khách đã đồng ý rõ ràng. Không cần tham số.',
      parameters: {
        type: 'object',
        properties: {},
        required: [],
      },
      execute: async () => {
        // Lấy & XOÁ phiếu chờ của HỘI THOẠI NÀY — chỉ chạy nếu còn hạn + đúng khách
        const action = consumePendingAction(conversationId, currentUser.id);
        if (!action) {
          return 'Chưa có phiếu chờ xác nhận nào (hoặc đã hết hạn). Hãy tạo lại bằng prepare_booking / prepare_cancellation trước.';
        }
        try {
          if (action.type === 'create_booking') {
            const p = action.payload;
            const booking = await bookingService.createBooking(currentUser.id, {
              hotelId: String(p.hotelId),
              roomTypeId: String(p.roomTypeId),
              checkInDate: new Date(String(p.checkInDate)),
              checkOutDate: new Date(String(p.checkOutDate)),
              numGuests: Number(p.numGuests),
              paymentMethod: p.paymentMethod === 'vnpay' ? 'vnpay' : 'cash',
            });
            return booking.status === 'confirmed'
              ? `Đặt phòng thành công! Mã booking: ${booking.bookingCode}. Đã xác nhận — khách trả tiền mặt tại khách sạn khi nhận phòng.`
              : `Đã tạo booking ${booking.bookingCode} (chờ thanh toán). Khách cần thanh toán online trong 15 phút để giữ phòng.`;
          }
          // cancel_booking
          const result = await bookingService.cancelBooking(
            String(action.payload.bookingId),
            currentUser,
            'Khách huỷ qua trợ lý AI'
          );
          const refundText = result.refund
            ? `Số tiền hoàn: ${result.refund.amount} VND.`
            : 'Booking chưa thanh toán nên không phát sinh hoàn tiền.';
          return `Đã huỷ booking thành công. ${refundText}`;
        } catch (err) {
          // Lỗi nghiệp vụ (hết phòng, quá hạn huỷ...) → báo lại để agent giải thích cho khách
          return `Không thực hiện được: ${(err as Error).message}`;
        }
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
