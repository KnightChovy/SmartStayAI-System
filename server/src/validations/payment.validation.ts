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

// Lấy QR chuyển khoản SePay cho một booking đang chờ thanh toán
export const createSepayPayment = {
  params: Joi.object().keys({
    bookingId: Joi.string().uuid().required(),
  }),
};

// Trả bằng ví: không nhận số tiền từ client — server tự tính min(số dư, còn thiếu) để khách không
// tự chọn trừ bao nhiêu, cũng không thể trừ vượt.
export const payWithWallet = {
  params: Joi.object().keys({
    bookingId: Joi.string().uuid().required(),
  }),
};

// Webhook SePay: API key kiểm ở controller. Ở đây chỉ chốt các field mình THỰC SỰ dùng để xử lý,
// và cho phép field lạ đi qua (SePay có thể bổ sung field mới mà không được làm vỡ webhook).
export const sepayWebhook = {
  body: Joi.object()
    .keys({
      id: Joi.number().required(),
      transferType: Joi.string().valid('in', 'out').required(),
      transferAmount: Joi.number().required(),
      content: Joi.string().allow('', null).default(''),
      code: Joi.string().allow('', null),
      gateway: Joi.string().allow('', null),
      transactionDate: Joi.string().allow('', null),
      accountNumber: Joi.string().allow('', null),
      referenceCode: Joi.string().allow('', null),
    })
    .unknown(true),
};
