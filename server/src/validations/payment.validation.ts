import Joi from 'joi';

// Tạo URL thanh toán VNPay cho một booking đang chờ thanh toán
export const createVnpayPayment = {
  params: Joi.object().keys({
    bookingId: Joi.string().uuid().required(),
  }),
};

// Callback VNPay (return + IPN): chữ ký được xác minh ở service, nên ở đây chỉ
// đảm bảo các field tối thiểu tồn tại và cho phép các field vnp_* khác đi qua.
export const vnpayCallback = {
  query: Joi.object()
    .keys({
      vnp_TxnRef: Joi.string().required(),
      vnp_ResponseCode: Joi.string().required(),
      vnp_SecureHash: Joi.string().required(),
    })
    .unknown(true),
};
