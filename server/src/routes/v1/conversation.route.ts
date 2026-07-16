import express from 'express';
import { optionalAuth } from '../../middlewares/auth';
import validate from '../../middlewares/validate';
import { chatLimiter } from '../../middlewares/rateLimiter';
import { conversationValidation } from '../../validations';
import { conversationController } from '../../controllers';

const router = express.Router();

// Chat với chatbot của một khách sạn. optionalAuth: khách CHƯA đăng nhập vẫn hỏi được (chế độ chỉ-đọc),
// khách đã đăng nhập có thêm quyền tra đơn/đặt/huỷ. chatLimiter chặn spam theo user (rơi về IP cho khách vãng lai).
router.post('/messages', optionalAuth, chatLimiter, validate(conversationValidation.sendMessage), conversationController.sendMessage);

// Bản STREAM (SSE) — trả lời từng mẩu chữ; body giống /messages
router.post('/messages/stream', optionalAuth, chatLimiter, validate(conversationValidation.sendMessage), conversationController.sendMessageStream);

// Danh sách "đã chat với KS nào" của chính khách (thanh bên kiểu Messenger). Khách vãng lai → [].
router.get('/mine', optionalAuth, conversationController.listMyConversations);

// Khôi phục hội thoại đang mở của khách sau khi F5 (?hotelId= ; trống = toàn sàn). Chưa có → null.
router.get('/me', optionalAuth, validate(conversationValidation.getMyConversation), conversationController.getMyConversation);

// Khách tự gạt công tắc AI ⇄ người thật. Đặt CUỐI (route có param) để không nuốt /mine, /me, /messages.
router.patch('/:conversationId/mode', optionalAuth, validate(conversationValidation.updateMode), conversationController.updateMode);

export default router;
