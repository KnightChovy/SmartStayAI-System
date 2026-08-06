import httpStatus from 'http-status';
import { Request, Response } from 'express';
import type { User } from '@prisma/client';
import catchAsync from '../utils/catchAsync';
import pick from '../utils/pick';
import { conversationService } from '../services';

// Cùng cách lấy IP như payment.controller: VNPay đòi vnp_IpAddr, mà sau proxy (Render) thì
// req.socket.remoteAddress là IP của proxy nên phải ưu tiên x-forwarded-for.
// Chatbot cần IP vì tool đặt phòng sinh luôn link thanh toán VNPay.
const clientIp = (req: Request): string =>
  (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || req.ip || '127.0.0.1';

export class ConversationController {
  // Khách gửi tin nhắn cho chatbot → nhận lại câu trả lời của bot
  sendMessage = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { hotelId, conversationId, message } = req.body;
    // optionalAuth: khách vãng lai không có req.user ⇒ truyền null xuống service (chế độ chỉ-đọc)
    const result = await conversationService.sendMessage(
      hotelId,
      conversationId,
      (req.user as User | undefined) ?? null,
      message,
      clientIp(req)
    );
    res.status(httpStatus.CREATED).send(result);
  });

  // Bản STREAM: trả lời từng mẩu chữ qua SSE (Server-Sent Events)
  sendMessageStream = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { hotelId, conversationId, message } = req.body;
    const { conversationId: convId, status, handoff, stream } = await conversationService.streamMessage(
      hotelId,
      conversationId,
      (req.user as User | undefined) ?? null,
      message,
      clientIp(req)
    );

    // Mở kênh SSE: 1 response HTTP giữ mở, server đẩy nhiều "event" xuống dần
    // (Lưu ý: nếu chunk bị gom cục, kiểm tra middleware compression có nén text/event-stream không)
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    // Gửi conversationId + trạng thái TRƯỚC lượt (event "meta") để client lưu. status/handoff ở đây có
    // thể CŨ (bot có thể tự escalate giữa lượt) — client đợi event "done" để lấy giá trị chốt.
    res.write(`event: meta\ndata: ${JSON.stringify({ conversationId: convId, status, handoff })}\n\n`);

    // Bơm từng mẩu chữ (event "chunk")
    for await (const chunk of stream) {
      res.write(`event: chunk\ndata: ${JSON.stringify({ text: chunk })}\n\n`);
    }

    // Báo xong (event "done") kèm status/handoff CHỐT (đọc tươi sau lượt) rồi đóng kênh
    const final = await conversationService.getHandoffState(convId);
    res.write(`event: done\ndata: ${JSON.stringify(final)}\n\n`);
    res.end();
  });

  // Danh sách "đã nhắn với KS nào" của chính khách (đã đăng nhập). Khách vãng lai → [].
  listMyConversations = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const result = await conversationService.listMyConversations((req.user as User | undefined) ?? null);
    res.send(result);
  });

  // Khôi phục hội thoại đang mở của khách sau khi F5 (theo hotelId, trống = toàn sàn). Chưa có → null.
  getMyConversation = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const result = await conversationService.getMyConversation(
      (req.user as User | undefined) ?? null,
      req.query.hotelId as string | undefined
    );
    // res.json để 'null' gửi đúng JSON (res.send(null) gửi body RỖNG → client JSON.parse('') ném lỗi)
    res.json(result ?? null);
  });

  // Khách tự gạt công tắc AI ⇄ người thật cho hội thoại của mình
  updateMode = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { mode, reason } = req.body;
    const result = await conversationService.setConversationMode(
      req.params.conversationId as string,
      (req.user as User | undefined) ?? null,
      mode,
      reason
    );
    res.send(result);
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
