import Joi from 'joi';

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

// [Platform Manager/Admin] Danh sách đối tác toàn sàn
export const listPartners = {
  query: Joi.object().keys({
    status: Joi.string().valid('pending', 'approved', 'suspended', 'rejected'),
    search: Joi.string(),
    limit: Joi.number().integer().min(1).max(100),
    page: Joi.number().integer().min(1),
  }),
};

// ===== Analytics & Performance (viewPlatformStats) =====
export const getAnalytics = {
  query: Joi.object().keys({
    period: Joi.string().valid('month', 'year'),
    range: Joi.number().integer().min(1).max(36),
    topLimit: Joi.number().integer().min(1).max(20),
  }),
};

export const getHotelPerformance = {
  params: Joi.object().keys({
    hotelId: Joi.string().uuid().required(),
  }),
  query: Joi.object().keys({
    from: Joi.date().iso(),
    to: Joi.date().iso().greater(Joi.ref('from')),
  }),
};

export const getPerformanceLeaderboard = {
  query: Joi.object().keys({
    from: Joi.date().iso(),
    to: Joi.date().iso().greater(Joi.ref('from')),
  }),
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
