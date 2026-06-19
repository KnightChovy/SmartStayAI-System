import Joi from 'joi';

// Khách gửi 1 tin nhắn cho chatbot của một khách sạn
export const sendMessage = {
  body: Joi.object().keys({
    hotelId: Joi.string().uuid().required(),
    conversationId: Joi.string().uuid(), // có thì nối tiếp hội thoại cũ, không có thì tạo mới
    message: Joi.string().max(2000).required(),
  }),
};
