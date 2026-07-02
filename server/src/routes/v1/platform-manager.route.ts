import express from 'express';
import auth from '../../middlewares/auth';
import validate from '../../middlewares/validate';
import { adminValidation } from '../../validations';
import { adminController } from '../../controllers';

const router = express.Router();

// Danh sách toàn bộ đối tác (hotel_partner) — Platform Manager (admin cũng truy cập được)
router.get('/partners', auth('viewPlatformStats'), validate(adminValidation.listPartners), adminController.listPartners);

// Analytics & hiệu suất toàn sàn — Platform Manager (quyền viewPlatformStats; admin cũng có quyền này).
// Handler tái dùng adminController vì nghiệp vụ chung tầng platform.
router.get('/analytics', auth('viewPlatformStats'), validate(adminValidation.getAnalytics), adminController.getAnalytics);

// Bảng xếp hạng hiệu suất toàn sàn
router.get(
  '/performance',
  auth('viewPlatformStats'),
  validate(adminValidation.getPerformanceLeaderboard),
  adminController.getPerformanceLeaderboard
);

// Hiệu suất + điểm chi tiết của 1 khách sạn
router.get(
  '/hotels/:hotelId/performance',
  auth('viewPlatformStats'),
  validate(adminValidation.getHotelPerformance),
  adminController.getHotelPerformance
);

export default router;
