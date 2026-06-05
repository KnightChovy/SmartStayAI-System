import Joi from 'joi';

const hotelParams = Joi.object().keys({
  hotelId: Joi.string().uuid().required(),
});

const ruleParams = Joi.object().keys({
  hotelId: Joi.string().uuid().required(),
  ruleId: Joi.string().uuid().required(),
});

const ruleFields = {
  roomTypeId: Joi.string().uuid().allow(null),
  name: Joi.string().max(255),
  ruleType: Joi.string().valid('seasonal', 'weekend', 'occupancy', 'early_bird'),
  startDate: Joi.date().iso(),
  endDate: Joi.date().iso(),
  // 0=Chủ nhật .. 6=Thứ bảy; mảng rỗng = áp mọi ngày trong tuần
  dayOfWeek: Joi.array().items(Joi.number().integer().min(0).max(6)).unique(),
  occupancyThreshold: Joi.number().integer().min(1).max(100).allow(null),
  adjustmentType: Joi.string().valid('percentage', 'fixed'),
  // Âm = giảm giá; percentage giới hạn ±100%, fixed thì tuỳ tiền tệ
  adjustmentValue: Joi.number(),
  priority: Joi.number().integer().min(0).max(1000),
  isActive: Joi.boolean(),
};

export const createRule = {
  params: hotelParams,
  body: Joi.object().keys({
    ...ruleFields,
    name: ruleFields.name.required(),
    ruleType: ruleFields.ruleType.required(),
    startDate: ruleFields.startDate.required(),
    endDate: Joi.date().iso().min(Joi.ref('startDate')).required(),
    adjustmentType: ruleFields.adjustmentType.required(),
    adjustmentValue: ruleFields.adjustmentValue.required(),
    // Rule occupancy bắt buộc phải có ngưỡng % lấp đầy
    occupancyThreshold: Joi.when('ruleType', {
      is: 'occupancy',
      then: Joi.number().integer().min(1).max(100).required(),
      otherwise: ruleFields.occupancyThreshold,
    }),
  }),
};

export const listRules = {
  params: hotelParams,
  query: Joi.object().keys({
    roomTypeId: Joi.string().uuid(),
    isActive: Joi.boolean(),
  }),
};

export const updateRule = {
  params: ruleParams,
  body: Joi.object().keys(ruleFields).min(1),
};

export const deleteRule = {
  params: ruleParams,
};
