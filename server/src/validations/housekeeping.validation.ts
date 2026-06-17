import Joi from 'joi';

// Danh sách task dọn phòng của khách sạn
export const listTasks = {
  params: Joi.object().keys({
    hotelId: Joi.string().uuid().required(),
  }),
  query: Joi.object().keys({
    status: Joi.string().valid('pending', 'in_progress', 'done'),
  }),
};

// Hoàn thành task dọn phòng (1-tap)
export const completeTask = {
  params: Joi.object().keys({
    hotelId: Joi.string().uuid().required(),
    taskId: Joi.string().uuid().required(),
  }),
};
