import Joi from 'joi';

// ===== Phase A — Doanh thu & ví khách sạn =====
export const getHotelRevenue = {
  params: Joi.object().keys({
    hotelId: Joi.string().uuid().required(),
  }),
  query: Joi.object().keys({
    from: Joi.date().iso(),
    to: Joi.date().iso().min(Joi.ref('from')),
    groupBy: Joi.string().valid('day', 'month').default('day'),
  }),
};

export const getHotelWallet = {
  params: Joi.object().keys({
    hotelId: Joi.string().uuid().required(),
  }),
  query: Joi.object().keys({
    type: Joi.string().valid('earning', 'commission', 'payout', 'refund', 'adjustment'),
    limit: Joi.number().integer().min(1).max(100),
    page: Joi.number().integer().min(1),
  }),
};

export const getHotelAnalytics = {
  params: Joi.object().keys({
    hotelId: Joi.string().uuid().required(),
  }),
  query: Joi.object().keys({
    from: Joi.date().iso(),
    to: Joi.date().iso().greater(Joi.ref('from')),
  }),
};
