import Joi from 'joi';

const hotelParams = Joi.object().keys({
  hotelId: Joi.string().uuid().required(),
});

const roomTypeParams = Joi.object().keys({
  hotelId: Joi.string().uuid().required(),
  roomTypeId: Joi.string().uuid().required(),
});

const roomTypeFields = {
  name: Joi.string().max(255),
  description: Joi.string().max(2000).allow('', null),
  maxOccupancy: Joi.number().integer().min(1).max(20),
  basePrice: Joi.number().min(0),
  areaSqm: Joi.number().min(0).allow(null),
  bedType: Joi.string().max(100).allow('', null),
  viewType: Joi.string().max(100).allow('', null),
  isActive: Joi.boolean(),
};

export const createRoomType = {
  params: hotelParams,
  body: Joi.object().keys({
    ...roomTypeFields,
    name: roomTypeFields.name.required(),
    maxOccupancy: roomTypeFields.maxOccupancy.required(),
    basePrice: roomTypeFields.basePrice.required(),
  }),
};

export const updateRoomType = {
  params: roomTypeParams,
  body: Joi.object().keys(roomTypeFields).min(1),
};

export const deleteRoomType = {
  params: roomTypeParams,
};

export const listRoomTypes = {
  params: hotelParams,
};

export const addImages = {
  params: roomTypeParams,
  body: Joi.object().keys({
    images: Joi.array()
      .items(
        Joi.object().keys({
          url: Joi.string().uri().required(),
          isPrimary: Joi.boolean(),
          sortOrder: Joi.number().integer().min(0),
        })
      )
      .min(1)
      .required(),
  }),
};

export const setAmenities = {
  params: roomTypeParams,
  body: Joi.object().keys({
    // Danh sách THAY THẾ toàn bộ tiện nghi hiện có; mảng rỗng = bỏ hết. Mỗi dòng kèm isFree/quantity.
    amenities: Joi.array()
      .items(
        Joi.object().keys({
          amenityId: Joi.string().uuid().required(),
          isFree: Joi.boolean(),
          quantity: Joi.number().integer().min(0).allow(null),
        })
      )
      .unique('amenityId')
      .required(),
  }),
};
