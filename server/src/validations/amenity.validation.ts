import Joi from 'joi';

export const listAmenities = {
  query: Joi.object().keys({
    category: Joi.string().valid('room', 'hotel', 'service'),
  }),
};

export const createAmenity = {
  body: Joi.object().keys({
    name: Joi.string().max(255).required(),
    icon: Joi.string().max(100).allow('', null),
    category: Joi.string().valid('room', 'hotel', 'service').required(),
  }),
};
