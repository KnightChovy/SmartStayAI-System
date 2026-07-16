import express from 'express';
import auth from '../../middlewares/auth';
import validate from '../../middlewares/validate';
import { bookingValidation } from '../../validations';
import { bookingController } from '../../controllers';

const router = express.Router();

router.post('/', auth(), validate(bookingValidation.createBooking), bookingController.createBooking);
router.get('/me', auth(), validate(bookingValidation.getMyBookings), bookingController.getMyBookings);
router.get('/:bookingId', auth(), validate(bookingValidation.getBooking), bookingController.getBooking);
// Xem trước tiền hoàn — cho khách biết mất bao nhiêu TRƯỚC khi bấm huỷ. Chỉ đọc, không đổi gì.
// Đặt trước '/:bookingId/cancel' cho cùng nhóm; cả hai chỉ chủ booking hoặc manageBookings.
router.get(
  '/:bookingId/refund-preview',
  auth(),
  validate(bookingValidation.getRefundPreview),
  bookingController.getRefundPreview
);
router.patch('/:bookingId/cancel', auth(), validate(bookingValidation.cancelBooking), bookingController.cancelBooking);
export default router;
