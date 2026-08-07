import Joi from 'joi';

const roomStatus = Joi.string().valid('available', 'occupied', 'maintenance', 'cleaning');
const hkStatus = Joi.string().valid('dirty', 'cleaning', 'clean', 'inspected');

/**
 * Trạng thái được phép đặt khi TẠO/SỬA phòng.
 *
 * Cố tình KHÔNG có 'maintenance': trước đây nhận giá trị này sẽ đẻ ra một đợt chặn cứng 7 ngày với
 * lý do bịa sẵn, tức là form phòng của partner âm thầm rút phòng khỏi kho bán mà không ai khai ngày
 * dự kiến xong. Bảo trì bây giờ chỉ đi qua POST /hotels/:hotelId/rooms/:roomId/blocks (có khoảng
 * ngày + lý do thật). 'occupied' cũng không nhận: nó phải đi kèm một booking, chỉ check-in tạo ra.
 */
const editableRoomStatus = Joi.string()
  .valid('available', 'cleaning')
  .messages({
    // Không dùng {} trong thông báo: Joi coi đó là placeholder của template và xoá mất nội dung bên trong
    'any.only':
      'Trạng thái phòng khi tạo/sửa chỉ nhận "available" hoặc "cleaning". ' +
      'Phòng đang sửa: dùng POST /hotels/:hotelId/rooms/:roomId/blocks để chặn theo khoảng ngày. ' +
      'Phòng có khách: chỉ sinh ra từ check-in.',
  });

export const createRoom = {
  params: Joi.object().keys({
    hotelId: Joi.string().uuid().required(),
  }),
  body: Joi.object().keys({
    roomTypeId: Joi.string().uuid().required(),
    roomNumber: Joi.string().max(20).required(),
    floor: Joi.number().integer().min(0).max(200).allow(null),
    status: editableRoomStatus,
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
      status: editableRoomStatus,
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

/**
 * Lịch tồn kho theo từng đêm. Chặn 92 ngày một lượt: mỗi ngày × mỗi loại phòng là một dòng, để
 * khoảng ngày tự do thì một khách sạn nhiều loại phòng kéo về hàng chục nghìn dòng cho một màn lịch.
 */
const MAX_CALENDAR_DAYS = 92;
const calendarRangeLimit = Joi.ref('from', {
  adjust: (from: Date): Date => {
    const limit = new Date(from);
    limit.setUTCDate(limit.getUTCDate() + MAX_CALENDAR_DAYS);
    return limit;
  },
});

export const getInventoryCalendar = {
  params: Joi.object().keys({
    hotelId: Joi.string().uuid().required(),
  }),
  query: Joi.object().keys({
    from: Joi.date().iso().required(),
    to: Joi.date()
      .iso()
      .min(Joi.ref('from'))
      .max(calendarRangeLimit)
      .required()
      .messages({
        'date.min': 'Ngày kết thúc không được trước ngày bắt đầu',
        'date.max': `Lịch tồn kho lấy tối đa ${MAX_CALENDAR_DAYS} ngày mỗi lượt — chia nhỏ khoảng ngày`,
      }),
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
 * @deprecated Lối vào CŨ của bản đồ phòng — không có chiều thời gian. Vẫn nhận đủ 4 giá trị để
 * client cũ không gãy ở tầng validate, nhưng service TỪ CHỐI 'occupied' (phải đi kèm booking) và
 * 'maintenance' (phải khai khoảng ngày). Dùng: PATCH .../housekeeping cho trạng thái dọn và
 * POST .../blocks cho phòng đang sửa.
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

/**
 * Sửa đợt chặn đang mở. Không nhận `startDate`/`blockType`: ngày bắt đầu đã trôi qua thì không viết
 * lại được, còn đổi loại chặn là đổi luôn ý nghĩa tồn kho — ca đó phải gỡ đợt cũ và tạo đợt mới.
 */
export const updateBlock = {
  params: Joi.object().keys({
    hotelId: Joi.string().uuid().required(),
    roomId: Joi.string().uuid().required(),
    blockId: Joi.string().uuid().required(),
  }),
  body: Joi.object()
    .keys({
      endDate: Joi.date().iso(),
      reason: Joi.string().trim().min(1).max(500),
      estimatedCost: Joi.number().min(0).max(999999999),
    })
    .min(1),
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
