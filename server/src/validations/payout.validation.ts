import Joi from 'joi';

const payoutStatus = Joi.string().valid('pending', 'processing', 'paid', 'failed');

// [Chủ KS] Tạo yêu cầu rút — tối thiểu 100.000đ, không vượt số dư khả dụng (kiểm ở service)
export const requestPayout = {
  params: Joi.object().keys({
    hotelId: Joi.string().uuid().required(),
  }),
  body: Joi.object().keys({
    amount: Joi.number().positive().min(100000).required(),
  }),
};

// [Chủ KS / manager] Lịch sử yêu cầu rút của khách sạn
export const listHotelPayouts = {
  params: Joi.object().keys({
    hotelId: Joi.string().uuid().required(),
  }),
  query: Joi.object().keys({
    status: payoutStatus,
    limit: Joi.number().integer().min(1).max(100),
    page: Joi.number().integer().min(1),
  }),
};

// [Platform Manager] Danh sách yêu cầu rút toàn sàn
export const listPlatformPayouts = {
  query: Joi.object().keys({
    status: payoutStatus,
    limit: Joi.number().integer().min(1).max(100),
    page: Joi.number().integer().min(1),
  }),
};

// [Platform Manager] Chi tiết 1 yêu cầu rút
export const getPayout = {
  params: Joi.object().keys({
    payoutId: Joi.string().uuid().required(),
  }),
};

// [Platform Manager] Duyệt / từ chối. payoutTransactionId = mã giao dịch ngân hàng khi đã chuyển khoản (approve)
export const reviewPayout = {
  params: Joi.object().keys({
    payoutId: Joi.string().uuid().required(),
  }),
  body: Joi.object().keys({
    decision: Joi.string().valid('approve', 'reject').required(),
    payoutTransactionId: Joi.string().trim().max(255),
    notes: Joi.string().trim().max(500),
  }),
};
