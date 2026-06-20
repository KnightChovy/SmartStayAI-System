import express from 'express';
import auth from '../../middlewares/auth';
import validate from '../../middlewares/validate';
import { conversationValidation } from '../../validations';
import { conversationController } from '../../controllers';

const router = express.Router();

// Khách (đã đăng nhập) chat với chatbot của một khách sạn
router.post('/messages', auth(), validate(conversationValidation.sendMessage), conversationController.sendMessage);

// Bản STREAM (SSE) — trả lời từng mẩu chữ; body giống /messages
router.post('/messages/stream', auth(), validate(conversationValidation.sendMessage), conversationController.sendMessageStream);

export default router;
