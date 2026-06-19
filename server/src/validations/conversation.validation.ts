import Joi from 'joi';

// Khách gửi 1 tin nhắn cho chatbot của một khách sạn
export const sendMessage = {
  body: Joi.object().keys({
    hotelId: Joi.string().uuid().required(),
    conversationId: Joi.string().uuid(), // có thì nối tiếp hội thoại cũ, không có thì tạo mới
    message: Joi.string().max(2000).required(),
  }),
};

// ===== S04: hộp thư nhân viên (staff/chủ KS) =====

// Liệt kê hội thoại của một KS, lọc theo trạng thái (UI thường lọc 'escalated')
export const listHotelConversations = {
  params: Joi.object().keys({
    hotelId: Joi.string().uuid().required(),
  }),
  query: Joi.object().keys({
    status: Joi.string().valid('active', 'resolved', 'escalated', 'closed'),
    limit: Joi.number().integer().min(1).max(100),
    page: Joi.number().integer().min(1),
  }),
};

// Chi tiết một hội thoại + toàn bộ tin nhắn
export const getHotelConversation = {
  params: Joi.object().keys({
    hotelId: Joi.string().uuid().required(),
    conversationId: Joi.string().uuid().required(),
  }),
};

// Nhân viên trả lời khách
export const replyConversation = {
  params: Joi.object().keys({
    hotelId: Joi.string().uuid().required(),
    conversationId: Joi.string().uuid().required(),
  }),
  body: Joi.object().keys({
    message: Joi.string().max(2000).required(),
  }),
};

// Đánh dấu hội thoại đã xử lý xong
export const resolveConversation = {
  params: Joi.object().keys({
    hotelId: Joi.string().uuid().required(),
    conversationId: Joi.string().uuid().required(),
  }),
};
