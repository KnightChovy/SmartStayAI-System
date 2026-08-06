import Joi from 'joi';

const roomStatus = Joi.string().valid('available', 'occupied', 'maintenance', 'cleaning');
const hkStatus = Joi.string().valid('dirty', 'cleaning', 'clean', 'inspected');

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
      isActive: Joi.boolean(),
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
    isActive: Joi.boolean(),
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

/**
 * Lối vào CŨ của bản đồ phòng. Vẫn nhận đủ 4 giá trị để FE hiện tại không gãy, nhưng service sẽ
 * từ chối 'occupied' (trạng thái đó phải đi kèm booking, chỉ check-in mới tạo ra được) và dịch
 * 'maintenance' thành một đợt chặn có hạn. Endpoint nên dùng: PATCH .../housekeeping và POST .../blocks.
 */
export const updateRoomStatus = {
  params: Joi.object().keys({
    hotelId: Joi.string().uuid().required(),
    roomId: Joi.string().uuid().required(),
  }),
  body: Joi.object().keys({
    status: roomStatus.required(),
  }),
};

// Buồng phòng đổi trạng thái dọn phòng
export const updateHousekeeping = {
  params: Joi.object().keys({
    hotelId: Joi.string().uuid().required(),
    roomId: Joi.string().uuid().required(),
  }),
  body: Joi.object().keys({
    hkStatus: hkStatus.required(),
  }),
};

/**
 * Tạo đợt chặn phòng. `reason` BẮT BUỘC và không được để trống: chặn phòng là rút một phòng khỏi
 * kho bán, phải có người chịu trách nhiệm giải thích vì sao.
 * `hkExpectedUntil`/`status` KHÔNG nhận từ client — server tự suy ra.
 */
export const createBlock = {
  params: Joi.object().keys({
    hotelId: Joi.string().uuid().required(),
    roomId: Joi.string().uuid().required(),
  }),
  query: Joi.object().keys({
    dryRun: Joi.boolean(),
  }),
  body: Joi.object().keys({
    blockType: Joi.string().valid('ooo', 'oos').required(),
    startDate: Joi.date().iso().required(),
    endDate: Joi.date().iso().min(Joi.ref('startDate')).required(),
    reason: Joi.string().trim().min(1).max(500).required(),
    estimatedCost: Joi.number().min(0).max(999999999),
  }),
};

export const resolveBlock = {
  params: Joi.object().keys({
    hotelId: Joi.string().uuid().required(),
    roomId: Joi.string().uuid().required(),
    blockId: Joi.string().uuid().required(),
  }),
};

export const listBlocks = {
  params: Joi.object().keys({
    hotelId: Joi.string().uuid().required(),
  }),
  query: Joi.object().keys({
    includeResolved: Joi.boolean(),
  }),
};
