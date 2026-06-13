import express from 'express';
import auth from '../../middlewares/auth';
import validate from '../../middlewares/validate';
import { hotelPartnerValidation } from '../../validations';
import { hotelPartnerController } from '../../controllers';

const router = express.Router();

router
  .route('/registrations')
  // Partner (user bất kỳ đã đăng nhập) nộp hồ sơ đăng ký khách sạn
  .post(auth(), validate(hotelPartnerValidation.submitRegistration), hotelPartnerController.submitRegistration)
  // platform_manager xem danh sách hồ sơ chờ duyệt
  .get(auth('manageHotelVerifications'), validate(hotelPartnerValidation.listRequests), hotelPartnerController.listRequests);

// Hồ sơ của chính user đang đăng nhập
router.get('/registrations/me', auth(), hotelPartnerController.getMyRequests);

// Chi tiết một hồ sơ (service tự kiểm quyền: chủ sở hữu hoặc manager)
router.get(
  '/registrations/:requestId',
  auth(),
  validate(hotelPartnerValidation.getRequest),
  hotelPartnerController.getRequest
);

// platform_manager duyệt / từ chối cả hồ sơ
router.patch(
  '/registrations/:requestId/review',
  auth('manageHotelVerifications'),
  validate(hotelPartnerValidation.reviewRequest),
  hotelPartnerController.reviewRequest
);

// platform_manager duyệt / từ chối TỪNG giấy tờ (Hướng B)
router.patch(
  '/documents/:documentId/review',
  auth('manageHotelVerifications'),
  validate(hotelPartnerValidation.reviewDocument),
  hotelPartnerController.reviewDocument
);

// Partner nộp lại file mới cho một giấy tờ bị từ chối (chỉ chủ sở hữu)
router.post(
  '/documents/:documentId/replace',
  auth(),
  validate(hotelPartnerValidation.replaceDocument),
  hotelPartnerController.replaceDocument
);

export default router;
