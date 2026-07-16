import express from 'express';
import auth from '../../middlewares/auth';
import validate from '../../middlewares/validate';
import { paymentValidation } from '../../validations';
import { paymentController } from '../../controllers';

const router = express.Router();

// Khách (chủ booking) tạo URL thanh toán VNPay cho booking đang chờ thanh toán
router.post(
  '/bookings/:bookingId/vnpay',
  auth(),
  validate(paymentValidation.createVnpayPayment),
  paymentController.createVnpayPayment
);

// Callback VNPay — PUBLIC (không auth): VNPay redirect trình duyệt / gọi server-to-server.
// Bảo mật dựa trên xác minh chữ ký vnp_SecureHash trong service, không dựa vào JWT.
router.get('/vnpay/return', validate(paymentValidation.vnpayCallback), paymentController.vnpayReturn);
router.get('/vnpay/ipn', validate(paymentValidation.vnpayCallback), paymentController.vnpayIpn);

// Khách (chủ booking) lấy QR chuyển khoản SePay cho booking đang chờ thanh toán
router.post(
  '/bookings/:bookingId/sepay',
  auth(),
  validate(paymentValidation.createSepayPayment),
  paymentController.createSepayPayment
);

// Webhook SePay — PUBLIC (không auth JWT): SePay gọi server-to-server khi tài khoản có tiền vào.
// Bảo mật bằng header "Authorization: Apikey <key>" kiểm trong controller/service.
router.post('/sepay/webhook', validate(paymentValidation.sepayWebhook), paymentController.sepayWebhook);

export default router;
