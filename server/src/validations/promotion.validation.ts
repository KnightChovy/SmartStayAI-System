import Joi from 'joi';

// [Public] Danh sách deal cho trang /deals
export const listDeals = {
  query: Joi.object().keys({
    limit: Joi.number().integer().min(1).max(100),
    city: Joi.string(),
  }),
};
