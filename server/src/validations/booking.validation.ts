import Joi from 'joi';

export const createBooking = {
  body: Joi.object().keys({
    hotelId: Joi.string().uuid().required(),
    roomTypeId: Joi.string().uuid().required(),
    checkInDate: Joi.date().iso().required(),
    checkOutDate: Joi.date().iso().greater(Joi.ref('checkInDate')).required(),
    numGuests: Joi.number().integer().min(1).required(),
    specialRequests: Joi.string().max(1000).allow('', null),
  }),
};

export const getMyBookings = {
  query: Joi.object().keys({
    status: Joi.string().valid('pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled', 'no_show'),
    sortBy: Joi.string(),
    limit: Joi.number().integer().min(1).max(100),
    page: Joi.number().integer().min(1),
  }),
};

export const getBooking = {
  params: Joi.object().keys({
    bookingId: Joi.string().uuid().required(),
  }),
};

export const cancelBooking = {
  params: Joi.object().keys({
    bookingId: Joi.string().uuid().required(),
  }),
  body: Joi.object().keys({
    reason: Joi.string().max(500).allow('', null),
  }),
};
