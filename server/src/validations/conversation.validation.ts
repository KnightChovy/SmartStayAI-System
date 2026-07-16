import Joi from 'joi';

// Khách gửi 1 tin nhắn cho chatbot.
// - CÓ hotelId  → chat với concierge của MỘT khách sạn (tra/đặt/huỷ theo KS đó).
// - KHÔNG hotelId → trợ lý TOÀN SÀN: chỉ tư vấn & tìm/gợi ý khách sạn trên sàn.
export const sendMessage = {
  body: Joi.object().keys({
    hotelId: Joi.string().uuid(), // bỏ trống = chế độ toàn sàn
    conversationId: Joi.string().uuid(), // có thì nối tiếp hội thoại cũ, không có thì tạo mới
    message: Joi.string().max(2000).required(),
  }),
};

// Khách tự gạt công tắc chế độ trả lời của hội thoại: 'human' = chuyển lễ tân, 'ai' = quay về bot.
export const updateMode = {
  params: Joi.object().keys({
    conversationId: Joi.string().uuid().required(),
  }),
  body: Joi.object().keys({
    mode: Joi.string().valid('ai', 'human').required(),
    reason: Joi.string().max(500), // dùng khi chuyển sang 'human'
  }),
};

// Khôi phục hội thoại đang mở của chính khách sau khi F5. hotelId trống = hội thoại toàn sàn.
export const getMyConversation = {
  query: Joi.object().keys({
    hotelId: Joi.string().uuid(),
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
