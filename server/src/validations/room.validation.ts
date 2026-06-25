import Joi from 'joi';

const roomStatus = Joi.string().valid('available', 'occupied', 'maintenance', 'cleaning');

export const createRoom = {
  params: Joi.object().keys({
    hotelId: Joi.string().uuid().required(),
  }),
  body: Joi.object().keys({
    roomTypeId: Joi.string().uuid().required(),
    roomNumber: Joi.string().max(20).required(),
    floor: Joi.number().integer().min(0).max(200).allow(null),
    status: roomStatus,
    notes: Joi.string().max(1000).allow('', null),
  }),
};

export const updateRoom = {
  params: Joi.object().keys({
    hotelId: Joi.string().uuid().required(),
    roomId: Joi.string().uuid().required(),
  }),
  body: Joi.object()
    .keys({
      roomNumber: Joi.string().max(20),
      floor: Joi.number().integer().min(0).max(200).allow(null),
      status: roomStatus,
      notes: Joi.string().max(1000).allow('', null),
    })
    .min(1),
};

export const listRooms = {
  params: Joi.object().keys({
    hotelId: Joi.string().uuid().required(),
  }),
  query: Joi.object().keys({
    status: roomStatus,
    roomTypeId: Joi.string().uuid(),
    sortBy: Joi.string(),
    limit: Joi.number().integer().min(1).max(200),
    page: Joi.number().integer().min(1),
  }),
};

// Xoá phòng vật lý
export const deleteRoom = {
  params: Joi.object().keys({
    hotelId: Joi.string().uuid().required(),
    roomId: Joi.string().uuid().required(),
  }),
};

// Staff đổi nhanh trạng thái phòng (bản đồ phòng / housekeeping 1-tap)
export const updateRoomStatus = {
  params: Joi.object().keys({
    hotelId: Joi.string().uuid().required(),
    roomId: Joi.string().uuid().required(),
  }),
  body: Joi.object().keys({
    status: roomStatus.required(),
  }),
};
