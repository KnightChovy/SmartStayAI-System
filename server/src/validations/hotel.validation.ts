import Joi from 'joi';

export const searchHotels = {
  query: Joi.object()
    .keys({
      city: Joi.string(),
      checkIn: Joi.date().iso(),
      checkOut: Joi.date().iso().greater(Joi.ref('checkIn')),
      guests: Joi.number().integer().min(1),
      sortBy: Joi.string(),
      limit: Joi.number().integer().min(1).max(100),
      page: Joi.number().integer().min(1),
    })
    // checkIn/checkOut phải đi cùng nhau — chỉ một trong hai thì không tính được tồn kho
    .and('checkIn', 'checkOut'),
};

// Chi tiết một khách sạn theo id (public)
export const getHotel = {
  params: Joi.object().keys({
    hotelId: Joi.string().uuid().required(),
  }),
};

// Partner bật/tắt mở bán (publish) khách sạn của mình
export const setHotelListing = {
  params: Joi.object().keys({
    hotelId: Joi.string().uuid().required(),
  }),
  body: Joi.object().keys({
    isListed: Joi.boolean().required(),
  }),
};

export const getRoomTypes = {
  params: Joi.object().keys({
    hotelId: Joi.string().uuid().required(),
  }),
  query: Joi.object()
    .keys({
      checkIn: Joi.date().iso(),
      checkOut: Joi.date().iso().greater(Joi.ref('checkIn')),
      guests: Joi.number().integer().min(1),
      minPrice: Joi.number().min(0),
      maxPrice: Joi.number().min(0),
      bedType: Joi.string(),
      viewType: Joi.string(),
    })
    .and('checkIn', 'checkOut'),
};
