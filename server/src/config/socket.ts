import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt, { JwtPayload } from 'jsonwebtoken';
import type { User } from '@prisma/client';
import config from './config';
import { tokenTypes } from './tokens';
import prisma from './prisma';
import logger from './logger';
import { hotelService } from '../services/hotel.service';

// Giữ 1 instance Socket.IO duy nhất cho cả tiến trình (giống prisma) để service ở tầng dưới
// emit được sự kiện mà không phải "thread" object io qua từng lời gọi hàm.
let io: Server | null = null;

// Tên room:
//  - conversation:<id> → khách + nhân viên ĐANG mở đúng hội thoại đó (kênh chat 2 chiều).
//  - hotel:<id>        → tất cả nhân viên/chủ KS đang trực hộp thư của khách sạn (báo có việc mới).
const conversationRoom = (conversationId: string): string => `conversation:${conversationId}`;
const hotelRoom = (hotelId: string): string => `hotel:${hotelId}`;

// Xác thực JWT cho socket — CÙNG luật với passport.ts (payload.type = access, user còn tồn tại & active).
// Trả về User nếu token hợp lệ, ngược lại null. Token KHÔNG hợp lệ vẫn cho kết nối (null) vì KHÁCH VÃNG LAI
// cũng cần nghe hội thoại của chính họ — quyền vào room sẽ được kiểm riêng khi join (xem handlers bên dưới).
const authenticateSocket = async (token: string | undefined): Promise<User | null> => {
  if (!token) {
    return null;
  }
  try {
    const payload = jwt.verify(token, config.jwt.secret) as JwtPayload;
    if (payload.type !== tokenTypes.ACCESS) {
      return null;
    }
    const user = await prisma.user.findFirst({ where: { id: payload.sub as string, deletedAt: null } });
    if (!user || user.status !== 'active') {
      return null;
    }
    return user;
  } catch {
    // Token hết hạn / sai chữ ký → coi như khách vãng lai, không ném lỗi làm rớt kết nối
    return null;
  }
};

// Nhân viên có được thao tác khách sạn này không (chủ KS / manager / staff được phân công).
// Bọc getOperableHotel (vốn NÉM lỗi khi không có quyền) thành boolean để dùng trong điều kiện join room.
const canOperateHotel = async (hotelId: string, user: User): Promise<boolean> => {
  try {
    await hotelService.getOperableHotel(hotelId, user);
    return true;
  } catch {
    return false;
  }
};

const registerHandlers = (socket: Socket): void => {
  // authenticateSocket đã chạy ở middleware io.use → user (hoặc null) nằm sẵn trong socket.data
  const user = (socket.data.user as User | null) ?? null;

  // KHÁCH hoặc NHÂN VIÊN xin vào room của một hội thoại để nhận tin real-time.
  // Chốt bảo mật: chỉ cho join nếu đúng chủ hội thoại, HOẶC là nhân viên có quyền ở khách sạn đó.
  // (conversationId là UUID bí mật chỉ trả về cho đúng phiên chat — cùng mô hình bảo mật với REST/SSE.)
  socket.on('conversation:join', async (conversationId: string) => {
    try {
      const conversation = await prisma.conversation.findUnique({ where: { id: conversationId } });
      if (!conversation) {
        return;
      }
      const allowed = user
        ? conversation.userId === user.id || (await canOperateHotel(conversation.hotelId, user))
        : conversation.userId === null; // khách vãng lai chỉ vào được hội thoại vô danh (userId null)
      if (allowed) {
        await socket.join(conversationRoom(conversationId));
      }
    } catch (err) {
      logger.error(`[socket] conversation:join lỗi: ${(err as Error).message}`);
    }
  });

  // NHÂN VIÊN trực hộp thư của một khách sạn — nhận thông báo hội thoại mới bị chuyển lên (escalated).
  socket.on('hotel:join', async (hotelId: string) => {
    if (!user) {
      return; // khách vãng lai không có hộp thư nhân viên
    }
    if (await canOperateHotel(hotelId, user)) {
      await socket.join(hotelRoom(hotelId));
    }
  });

  // Cho phép rời room khi client đóng khung chat (đỡ nhận tin thừa); ngắt kết nối thì socket.io tự dọn.
  socket.on('conversation:leave', (conversationId: string) => {
    socket.leave(conversationRoom(conversationId));
  });
};

// Gắn Socket.IO vào cùng HTTP server của Express (dùng chung 1 cổng, không mở thêm server/cổng mới).
export const initSocket = (httpServer: HttpServer): Server => {
  io = new Server(httpServer, {
    // CORS mở giống app Express hiện tại (cors()); socket xác thực bằng token trong handshake, không dùng cookie.
    cors: { origin: '*' },
  });

  // Middleware xác thực chạy 1 lần lúc bắt tay: gắn user (hoặc null) vào socket để handlers dùng lại.
  io.use(async (socket, next) => {
    socket.data.user = await authenticateSocket(socket.handshake.auth?.token as string | undefined);
    next();
  });

  io.on('connection', registerHandlers);
  logger.info('Socket.IO initialized');
  return io;
};

// ===== Helpers cho tầng service gọi để đẩy sự kiện (no-op nếu socket chưa init, vd trong test) =====

// Tin nhắn mới trong một hội thoại → đẩy cho cả khách và nhân viên đang mở hội thoại đó.
export const emitMessageToConversation = (conversationId: string, message: unknown): void => {
  io?.to(conversationRoom(conversationId)).emit('message:new', message);
};

// Một hội thoại vừa bị chuyển cho người thật → báo hộp thư nhân viên của khách sạn để hiện việc mới ngay.
export const emitConversationEscalated = (
  hotelId: string,
  payload: { conversationId: string; reason: string }
): void => {
  io?.to(hotelRoom(hotelId)).emit('conversation:escalated', payload);
};
