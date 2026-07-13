import httpStatus from 'http-status';
import { Request, Response } from 'express';
import type { User } from '@prisma/client';
import catchAsync from '../utils/catchAsync';
import pick from '../utils/pick';
import { conversationService } from '../services';

export class ConversationController {
  // Khách gửi tin nhắn cho chatbot → nhận lại câu trả lời của bot
  sendMessage = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { hotelId, conversationId, message } = req.body;
    // optionalAuth: khách vãng lai không có req.user ⇒ truyền null xuống service (chế độ chỉ-đọc)
    const result = await conversationService.sendMessage(hotelId, conversationId, (req.user as User | undefined) ?? null, message);
    res.status(httpStatus.CREATED).send(result);
  });

  // Bản STREAM: trả lời từng mẩu chữ qua SSE (Server-Sent Events)
  sendMessageStream = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { hotelId, conversationId, message } = req.body;
    const { conversationId: convId, stream } = await conversationService.streamMessage(
      hotelId,
      conversationId,
      (req.user as User | undefined) ?? null,
      message
    );

    // Mở kênh SSE: 1 response HTTP giữ mở, server đẩy nhiều "event" xuống dần
    // (Lưu ý: nếu chunk bị gom cục, kiểm tra middleware compression có nén text/event-stream không)
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    // Gửi conversationId trước (event "meta") để client lưu, dùng cho lượt sau
    res.write(`event: meta\ndata: ${JSON.stringify({ conversationId: convId })}\n\n`);

    // Bơm từng mẩu chữ (event "chunk")
    for await (const chunk of stream) {
      res.write(`event: chunk\ndata: ${JSON.stringify({ text: chunk })}\n\n`);
    }

    // Báo xong (event "done") rồi đóng kênh
    res.write('event: done\ndata: {}\n\n');
    res.end();
  });

  // ===== S04: hộp thư nhân viên — xem & trả lời hội thoại của một khách sạn =====

  // Danh sách hội thoại của KS (mặc định lọc 'escalated'), kèm preview + tên khách
  listHotelConversations = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const filter = pick(req.query, ['status']);
    const options = pick(req.query, ['limit', 'page']);
    const result = await conversationService.listHotelConversations(
      req.params.hotelId as string,
      req.user as User,
      filter,
      options
    );
    res.send(result);
  });

  // Chi tiết một hội thoại + toàn bộ tin nhắn
  getHotelConversation = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const conversation = await conversationService.getHotelConversation(
      req.params.hotelId as string,
      req.params.conversationId as string,
      req.user as User
    );
    res.send(conversation);
  });

  // Nhân viên gửi tin trả lời khách (nhận hội thoại + chuyển về 'active')
  replyConversation = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const message = await conversationService.replyToConversation(
      req.params.hotelId as string,
      req.params.conversationId as string,
      req.user as User,
      req.body.message
    );
    res.status(httpStatus.CREATED).send(message);
  });

  // Đánh dấu hội thoại đã xử lý xong ('resolved')
  resolveConversation = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const conversation = await conversationService.resolveConversation(
      req.params.hotelId as string,
      req.params.conversationId as string,
      req.user as User
    );
    res.send(conversation);
  });
}

export const conversationController = new ConversationController();
