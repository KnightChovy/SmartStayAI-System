import Joi from 'joi';

// [Public] Gợi ý điểm đến (autocomplete)
export const suggestDestinations = {
  query: Joi.object().keys({
    q: Joi.string().min(1).required(),
    limit: Joi.number().integer().min(1).max(20),
  }),
};
