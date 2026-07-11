import Joi from 'joi';

// ===== Phase B — Doanh thu nền tảng =====
export const getPlatformRevenue = {
  query: Joi.object().keys({
    from: Joi.date().iso(),
    to: Joi.date().iso().min(Joi.ref('from')),
    groupBy: Joi.string().valid('day', 'month').default('month'),
  }),
};

// ===== Pha 3 — Hoa hồng / payout =====
export const listCommissions = {
  query: Joi.object().keys({
    status: Joi.string().valid('pending', 'settled', 'disputed'),
    partnerId: Joi.string().uuid(),
    limit: Joi.number().integer().min(1).max(100),
    page: Joi.number().integer().min(1),
  }),
};

export const settleCommission = {
  params: Joi.object().keys({
    commissionId: Joi.string().uuid().required(),
  }),
};

// ===== Pha 4 — Giám sát khách sạn toàn sàn =====
export const listHotels = {
  query: Joi.object().keys({
    search: Joi.string(),
    isListed: Joi.boolean(),
    isActive: Joi.boolean(),
    limit: Joi.number().integer().min(1).max(100),
    page: Joi.number().integer().min(1),
  }),
};

export const updateHotelFlags = {
  params: Joi.object().keys({
    hotelId: Joi.string().uuid().required(),
  }),
  body: Joi.object()
    .keys({
      isListed: Joi.boolean(),
      isActive: Joi.boolean(),
    })
    .min(1), // phải gửi ít nhất 1 cờ để đổi
};

// ===== Pha 5 — Audit log =====
export const listAuditLogs = {
  query: Joi.object().keys({
    action: Joi.string(),
    entityType: Joi.string(),
    userId: Joi.string().uuid(),
    limit: Joi.number().integer().min(1).max(100),
    page: Joi.number().integer().min(1),
  }),
};

// ===== Pha 6 — Giao dịch thanh toán toàn sàn =====
export const listPayments = {
  query: Joi.object().keys({
    // 'unpaid' = booking chưa từng có khoản thanh toán nào (không phải trạng thái thật của Payment)
    status: Joi.string().valid('pending', 'completed', 'failed', 'refunded', 'unpaid'),
    paymentMethod: Joi.string().valid('vnpay', 'sepay', 'stripe', 'cash'),
    hotelId: Joi.string().uuid(),
    limit: Joi.number().integer().min(1).max(100),
    page: Joi.number().integer().min(1),
  }),
};
