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

export default router;
