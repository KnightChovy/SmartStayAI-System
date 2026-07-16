import Joi from 'joi';

const REFUND_STATUSES = ['pending', 'approved', 'processed', 'rejected'];

// [KS] Danh sách yêu cầu hoàn tiền của một khách sạn
export const listHotelRefunds = {
  params: Joi.object().keys({
    hotelId: Joi.string().uuid().required(),
  }),
  query: Joi.object().keys({
    status: Joi.string().valid(...REFUND_STATUSES),
    limit: Joi.number().integer().min(1).max(100),
    page: Joi.number().integer().min(1),
  }),
};

// [KS] Duyệt / từ chối yêu cầu hoàn tiền. Từ chối BẮT BUỘC nêu lý do (service kiểm lại lần nữa).
export const reviewRefund = {
  params: Joi.object().keys({
    hotelId: Joi.string().uuid().required(),
    refundId: Joi.string().uuid().required(),
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

// [Admin/PM] Danh sách yêu cầu hoàn tiền toàn sàn
export const listAllRefunds = {
  query: Joi.object().keys({
    status: Joi.string().valid(...REFUND_STATUSES),
    hotelId: Joi.string().uuid(),
    limit: Joi.number().integer().min(1).max(100),
    page: Joi.number().integer().min(1),
  }),
};

// [Admin] Đánh dấu đã chuyển khoản xong — bắt buộc có mã giao dịch thật để đối soát
export const processRefund = {
  params: Joi.object().keys({
    refundId: Joi.string().uuid().required(),
  }),
  body: Joi.object().keys({
    refundTransactionId: Joi.string().max(100).required(),
  }),
};
