import httpStatus from 'http-status';
import { Request, Response } from 'express';
import type { User } from '@prisma/client';
import catchAsync from '../utils/catchAsync';
import { conversationService } from '../services';

export class ConversationController {
  // Khách gửi tin nhắn cho chatbot → nhận lại câu trả lời của bot
  sendMessage = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { hotelId, conversationId, message } = req.body;
    const result = await conversationService.sendMessage(hotelId, conversationId, req.user as User, message);
    res.status(httpStatus.CREATED).send(result);
  });

  // Bản STREAM: trả lời từng mẩu chữ qua SSE (Server-Sent Events)
  sendMessageStream = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { hotelId, conversationId, message } = req.body;
    const { conversationId: convId, stream } = await conversationService.streamMessage(
      hotelId,
      conversationId,
      req.user as User,
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
}

export const conversationController = new ConversationController();
