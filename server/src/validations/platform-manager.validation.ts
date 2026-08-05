import Joi from 'joi';

// Danh sách đối tác toàn sàn
export const listPartners = {
  query: Joi.object().keys({
    status: Joi.string().valid('pending', 'approved', 'suspended', 'rejected'),
    search: Joi.string(),
    limit: Joi.number().integer().min(1).max(100),
    page: Joi.number().integer().min(1),
  }),
};

// Báo cáo analytics toàn sàn
export const getAnalytics = {
  query: Joi.object().keys({
    period: Joi.string().valid('month', 'year'),
    range: Joi.number().integer().min(1).max(36),
    topLimit: Joi.number().integer().min(1).max(20),
  }),
};

// Hiệu suất + điểm chi tiết của 1 khách sạn
export const getHotelPerformance = {
  params: Joi.object().keys({
    hotelId: Joi.string().uuid().required(),
  }),
  query: Joi.object().keys({
    from: Joi.date().iso(),
    to: Joi.date().iso().greater(Joi.ref('from')),
  }),
};

// Bảng xếp hạng hiệu suất toàn sàn
export const getPerformanceLeaderboard = {
  query: Joi.object().keys({
    from: Joi.date().iso(),
    to: Joi.date().iso().greater(Joi.ref('from')),
  }),
};

// Đình chỉ / khôi phục đối tác. Đình chỉ BẮT BUỘC nêu lý do — đối tác phải biết vì sao bị dừng.
export const setPartnerStatus = {
  params: Joi.object().keys({
    partnerId: Joi.string().uuid().required(),
  }),
  body: Joi.object().keys({
    action: Joi.string().valid('suspend', 'reactivate').required(),
    reason: Joi.string().max(500).when('action', {
      is: 'suspend',
      then: Joi.required(),
      otherwise: Joi.forbidden(),
    }),
  }),
};
