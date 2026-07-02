import express from 'express';
import auth from '../../middlewares/auth';
import validate from '../../middlewares/validate';
import { platformManagerValidation } from '../../validations';
import { platformManagerController } from '../../controllers';

const router = express.Router();

// Tất cả endpoint dưới đây dành cho Platform Manager (quyền viewPlatformStats; admin cũng có quyền này).

// Danh sách toàn bộ đối tác (hotel_partner)
router.get(
  '/partners',
  auth('viewPlatformStats'),
  validate(platformManagerValidation.listPartners),
  platformManagerController.listPartners
);

// Báo cáo analytics toàn sàn
router.get(
  '/analytics',
  auth('viewPlatformStats'),
  validate(platformManagerValidation.getAnalytics),
  platformManagerController.getAnalytics
);

// Bảng xếp hạng hiệu suất toàn sàn
router.get(
  '/performance',
  auth('viewPlatformStats'),
  validate(platformManagerValidation.getPerformanceLeaderboard),
  platformManagerController.getPerformanceLeaderboard
);

// Hiệu suất + điểm chi tiết của 1 khách sạn
router.get(
  '/hotels/:hotelId/performance',
  auth('viewPlatformStats'),
  validate(platformManagerValidation.getHotelPerformance),
  platformManagerController.getHotelPerformance
);

export default router;
