import Joi from 'joi';

const REQUEST_STATUSES = ['pending', 'approved', 'rejected'];

// [Đối tác] Mức hoa hồng hiện tại của một khách sạn (kèm hạn ưu đãi + có được nộp đơn không)
export const getHotelRate = {
  params: Joi.object().keys({
    hotelId: Joi.string().uuid().required(),
  }),
};

// [Đối tác] Nộp đơn xin giảm hoa hồng. Biên chi tiết (phải thấp hơn mức đang áp, không dưới sàn
// cứng) do service kiểm — ở đây chỉ chặn giá trị vô lý về mặt kiểu dữ liệu.
export const createRequest = {
  params: Joi.object().keys({
    hotelId: Joi.string().uuid().required(),
  }),
  body: Joi.object().keys({
    requestedRate: Joi.number().min(0).max(100).precision(2).required(),
    reason: Joi.string().min(10).max(1000).required(),
  }),
};

// [Đối tác] Lịch sử đơn của một khách sạn
export const listHotelRequests = {
  params: Joi.object().keys({
    hotelId: Joi.string().uuid().required(),
  }),
  query: Joi.object().keys({
    status: Joi.string().valid(...REQUEST_STATUSES),
    limit: Joi.number().integer().min(1).max(100),
    page: Joi.number().integer().min(1),
  }),
};

// [Platform Manager] Hàng chờ toàn sàn
export const listRequests = {
  query: Joi.object().keys({
    status: Joi.string().valid(...REQUEST_STATUSES),
    hotelId: Joi.string().uuid(),
    limit: Joi.number().integer().min(1).max(100),
    page: Joi.number().integer().min(1),
  }),
};

// [Platform Manager] Duyệt / từ chối. Từ chối BẮT BUỘC nêu lý do (service kiểm lại lần nữa).
export const reviewRequest = {
  params: Joi.object().keys({
    requestId: Joi.string().uuid().required(),
  }),
  body: Joi.object().keys({
    decision: Joi.string().valid('approve', 'reject').required(),
    rejectionReason: Joi.string().max(500).when('decision', {
      is: 'reject',
      then: Joi.required(),
      otherwise: Joi.forbidden(),
    }),
  }),
};

// [Platform Manager] Đặt mức hoa hồng nền toàn sàn (biên 10–30% + thời gian báo trước do service kiểm)
export const setBaseRate = {
  body: Joi.object().keys({
    rate: Joi.number().min(0).max(100).precision(2).required(),
    effectiveFrom: Joi.date().iso().required(),
  }),
};
