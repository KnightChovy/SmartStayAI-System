import express from 'express';
import auth from '../../middlewares/auth';
import validate from '../../middlewares/validate';
import { platformManagerValidation, bookingValidation, refundValidation } from '../../validations';
import { platformManagerController, bookingController, refundController } from '../../controllers';

const router = express.Router();

// Tất cả endpoint dưới đây dành cho Platform Manager (quyền viewPlatformStats; admin cũng có quyền này).

// Danh sách toàn bộ đối tác (hotel_partner)
router.get(
  '/partners',
  auth('viewPlatformStats'),
  validate(platformManagerValidation.listPartners),
  platformManagerController.listPartners
);

// Toàn bộ booking toàn sàn (lọc theo KS/đối tác/trạng thái/ngày + tìm kiếm)
router.get(
  '/bookings',
  auth('viewPlatformStats'),
  validate(bookingValidation.listPlatformBookings),
  bookingController.listPlatformBookings
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

// ===== Hoàn tiền (manageCommissions) =====
// Khách sạn là bên DUYỆT/TỪ CHỐI (PATCH /hotels/:hotelId/refunds/:refundId/review).
// Platform Manager là bên THỰC THI chuyển khoản, vì tiền khách trả nằm ở tài khoản của platform
// (mô hình escrow) chứ không nằm ở khách sạn — khách sạn không có tiền để tự hoàn.
router.get(
  '/refunds',
  auth('manageCommissions'),
  validate(refundValidation.listAllRefunds),
  refundController.listAllRefunds
);
router.patch(
  '/refunds/:refundId/process',
  auth('manageCommissions'),
  validate(refundValidation.processRefund),
  refundController.processRefund
);

export default router;
